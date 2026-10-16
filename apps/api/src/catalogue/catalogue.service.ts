import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@kisa/db";
import type {
  CategorySummary,
  ProductDetailResponse,
  ProductListQuery,
  ProductListResponse,
  TraceResponse,
} from "@kisa/shared";
import { PrismaService } from "../prisma/prisma.service";
import { isInStock, toBatch, toCategory, toFarmer, toPartner, toProduct } from "./mappers";

/** Today's date in India, as a DATE value (expiry is a calendar date, not a moment). */
const todayInIndia = () =>
  new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}T00:00:00.000Z`);

/**
 * A batch can be sold if its category is active and it has not reached expiresOn
 * (perishables stop selling on that date; non-perishables have no expiry).
 */
const sellable = (today: Date): Prisma.BatchWhereInput => ({
  category: { isActive: true },
  OR: [{ expiresOn: null }, { expiresOn: { gt: today } }],
});

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(): Promise<CategorySummary[]> {
    const rows = await this.prisma.category.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    return rows.map(toCategory);
  }

  async products(q: ProductListQuery): Promise<ProductListResponse> {
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        batch: {
          ...sellable(todayInIndia()),
          ...(q.category ? { categoryId: q.category } : {}),
          ...(q.salesModel ? { salesModel: q.salesModel } : {}),
        },
      },
      include: { batch: { include: { category: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Category order, then: perishables oldest batch first (FIFO); others in catalogue order.
    rows.sort((x, y) => {
      const cx = x.batch.category, cy = y.batch.category;
      if (cx.id !== cy.id) return cx.createdAt.getTime() - cy.createdAt.getTime() || cx.id.localeCompare(cy.id);
      if (cx.perishable) {
        const byPacked = x.batch.packedDate.getTime() - y.batch.packedDate.getTime();
        if (byPacked !== 0) return byPacked;
      }
      return x.createdAt.getTime() - y.createdAt.getTime();
    });

    const visible = q.inStock === undefined ? rows : rows.filter((p) => isInStock(p, p.batch) === q.inStock);
    const farmerIds = [...new Set(visible.map((p) => p.batch.farmerId))];
    const partnerIds = [...new Set(visible.map((p) => p.batch.partnerId))];
    const [farmers, partners] = await Promise.all([
      this.prisma.farmer.findMany({ where: { id: { in: farmerIds } }, orderBy: { createdAt: "asc" } }),
      this.prisma.partner.findMany({ where: { id: { in: partnerIds } }, orderBy: { createdAt: "asc" } }),
    ]);

    return {
      products: visible.map((p) => toProduct(p, p.batch)),
      farmers: farmers.map(toFarmer),
      partners: partners.map(toPartner),
    };
  }

  async product(slug: string): Promise<ProductDetailResponse> {
    const p = await this.prisma.product.findFirst({
      where: { slug, isActive: true, batch: sellable(todayInIndia()) },
      include: { batch: { include: { farmer: true, partner: true } } },
    });
    if (!p) throw new NotFoundException("Product not found");
    return {
      product: toProduct(p, p.batch),
      batch: toBatch(p.batch),
      farmer: toFarmer(p.batch.farmer),
      partner: toPartner(p.batch.partner),
    };
  }

  /** Trace works for any batch, even expired or sold out: it is what a pack's QR code opens. */
  async trace(batchId: string): Promise<TraceResponse> {
    const b = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        farmer: true,
        partner: true,
        products: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!b) throw new NotFoundException("Batch not found");
    return {
      batch: toBatch(b),
      farmer: toFarmer(b.farmer),
      partner: toPartner(b.partner),
      products: b.products.map((p) => toProduct(p, b)),
    };
  }
}
