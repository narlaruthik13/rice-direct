import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@kisa/db";
import type {
  CategorySummary,
  ProductDetailResponse,
  ProductListQuery,
  ProductListResponse,
  TraceResponse,
  Variety,
} from "@kisa/shared";
import { todayInIndia } from "../common/dates";
import { PrismaService } from "../prisma/prisma.service";
import { isInStock, toCategory, toPassport, toProduct, toVariety } from "./mappers";

/** A batch is on sale while its category and variety are active and it is before its best-before date. */
export const sellable = (today: Date): Prisma.BatchWhereInput => ({
  category: { isActive: true },
  variety: { isActive: true },
  bestBefore: { gt: today },
});

const withVariety = { variety: { select: { name: true, slug: true } } } as const;

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(): Promise<CategorySummary[]> {
    const rows = await this.prisma.category.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    return rows.map(toCategory);
  }

  async varieties(): Promise<Variety[]> {
    const rows = await this.prisma.variety.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: { name: "asc" },
    });
    return rows.map(toVariety);
  }

  async products(q: ProductListQuery): Promise<ProductListResponse> {
    const attributeFilters: Prisma.BatchWhereInput[] = [
      ...(q.riceType ? [{ attributes: { path: ["riceType"], equals: q.riceType } }] : []),
      ...(q.age ? [{ attributes: { path: ["age"], equals: q.age } }] : []),
    ];
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(q.packSize ? { bagSizeKg: q.packSize } : {}),
        batch: {
          ...sellable(todayInIndia()),
          ...(q.category ? { categoryId: q.category } : {}),
          ...(q.variety ? { variety: { slug: q.variety, isActive: true } } : {}),
          ...(attributeFilters.length ? { AND: attributeFilters } : {}),
        },
      },
      include: { batch: { include: withVariety } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const visible = q.inStock === undefined ? rows : rows.filter((p) => isInStock(p, p.batch) === q.inStock);
    return { products: visible.map((p) => toProduct(p, p.batch)) };
  }

  async product(slug: string): Promise<ProductDetailResponse> {
    const p = await this.prisma.product.findFirst({
      where: { slug, isActive: true, batch: sellable(todayInIndia()) },
      include: { batch: { include: withVariety } },
    });
    if (!p) throw new NotFoundException("Product not found");
    return { product: toProduct(p, p.batch), passport: toPassport(p.batch) };
  }

  /** The Quality Passport works for any batch, even past best-before: it is what a bag's QR code opens. */
  async trace(batchId: string): Promise<TraceResponse> {
    const b = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { ...withVariety, products: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
    });
    if (!b) throw new NotFoundException("Batch not found");
    return { passport: toPassport(b), products: b.products.map((p) => toProduct(p, b)) };
  }
}
