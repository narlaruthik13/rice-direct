import {
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@kisa/db";
import type { Category } from "@kisa/db";
import {
  type AdminBatchDetail,
  type AdminBatchListItem,
  type AdminProduct,
  type BatchCreateInput,
  BatchCreateSchema,
  type BatchFields,
  batchIssues,
  type BatchListQuery,
  BatchListQuerySchema,
  BatchUpdateSchema,
  type CategoryId,
  CROPS,
  isCategoryId,
  type Paginated,
  priceMatchesParts,
  ProductInputSchema,
  ProductUpdateSchema,
  type StockAdjustmentInput,
  StockAdjustmentSchema,
} from "@kisa/shared";
import type { z } from "zod";
import type { AuthAdmin } from "../auth/auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { addDays, daysBetween, todayInIndia } from "../common/dates";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { toCategory } from "../catalogue/mappers";
import { PrismaService } from "../prisma/prisma.service";
import {
  batchSnapshot,
  productSnapshot,
  stockStatus,
  toAdminProduct,
  toAuditEntry,
  toStockAdjustment,
} from "./admin-mappers";
import { AuditService, created, diff } from "./audit";
import {
  batchSuffixCandidates,
  dateValue,
  IdPipe,
  isoDate,
  nothingToUpdate,
  slugify,
  toPaise,
  validationError,
} from "./common";

type ProductInputData = z.output<typeof ProductInputSchema>;
type ProductUpdateData = z.output<typeof ProductUpdateSchema>;
type BatchUpdateData = z.output<typeof BatchUpdateSchema>;
type BatchCreateData = z.output<typeof BatchCreateSchema>;

/** Fields that can no longer change once any order includes the batch. */
const LOCKED_AFTER_ORDERS = ["salesModel", "farmerId", "partnerId", "outputKg"] as const;
const EXPIRY_WINDOW_DAYS = 7;

const listInclude = {
  farmer: { select: { id: true, name: true } },
  partner: { select: { id: true, name: true, type: true } },
  products: { select: { bagSizeKg: true, isActive: true } },
} satisfies Prisma.BatchInclude;

type ListRow = Prisma.BatchGetPayload<{ include: typeof listInclude }>;

function toListItem(b: ListRow, today: Date): AdminBatchListItem {
  const active = b.products.filter((p) => p.isActive).map((p) => p.bagSizeKg);
  return {
    id: b.id,
    categoryId: b.categoryId as CategoryId,
    salesModel: b.salesModel,
    variety: b.variety,
    farmer: b.farmer,
    partner: b.partner,
    packedDate: isoDate(b.packedDate),
    expiresOn: b.expiresOn ? isoDate(b.expiresOn) : null,
    daysLeft: b.expiresOn ? daysBetween(today, b.expiresOn) : null,
    outputKg: b.outputKg,
    availableKg: b.availableKg,
    stockStatus: stockStatus(b.availableKg, active),
    productCount: b.products.length,
  };
}

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- Batches ----------

  /**
   * Filters by category, sales model, farmer, partner and search in the database; stock
   * status depends on each batch's pack sizes, so it is filtered (and the list paged) here.
   * Fine for hundreds of batches; move to SQL if the catalogue grows to many thousands.
   */
  async list(q: BatchListQuery): Promise<Paginated<AdminBatchListItem>> {
    const today = todayInIndia();
    const rows = await this.prisma.batch.findMany({
      where: {
        ...(q.category ? { categoryId: q.category } : {}),
        ...(q.salesModel ? { salesModel: q.salesModel } : {}),
        ...(q.farmerId ? { farmerId: q.farmerId } : {}),
        ...(q.partnerId ? { partnerId: q.partnerId } : {}),
        ...(q.expiringSoon ? { expiresOn: { gt: today, lte: addDays(today, EXPIRY_WINDOW_DAYS) } } : {}),
        ...(q.search
          ? { OR: [{ id: { contains: q.search, mode: "insensitive" } }, { variety: { contains: q.search, mode: "insensitive" } }] }
          : {}),
      },
      include: listInclude,
    });
    let items = rows.map((b) => toListItem(b, today));
    if (q.stock) items = items.filter((b) => b.stockStatus === q.stock);
    const dir = q.order === "asc" ? 1 : -1;
    const key = (b: AdminBatchListItem, row: ListRow) =>
      q.sort === "availableKg" ? b.availableKg : q.sort === "id" ? b.id : q.sort === "createdAt" ? row.createdAt.getTime() : b.packedDate;
    const rowById = new Map(rows.map((r) => [r.id, r]));
    items.sort((a, b) => {
      const ka = key(a, rowById.get(a.id)!), kb = key(b, rowById.get(b.id)!);
      return (ka < kb ? -1 : ka > kb ? 1 : a.id.localeCompare(b.id)) * dir;
    });
    const start = (q.page - 1) * q.pageSize;
    return { items: items.slice(start, start + q.pageSize), total: items.length, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string): Promise<AdminBatchDetail> {
    const today = todayInIndia();
    const b = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        ...listInclude,
        category: true,
        products: { include: { _count: { select: { orderItems: true } } }, orderBy: { createdAt: "asc" } },
        stockAdjustments: { include: { adminUser: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
        _count: { select: { orderItems: true } },
      },
    });
    if (!b) throw new NotFoundException("Batch not found");
    const audit = await this.prisma.adminAuditLog.findMany({
      where: {
        OR: [
          { entity: "Batch", entityId: b.id },
          { entity: "Product", entityId: { in: b.products.map((p) => p.id) } },
        ],
      },
      include: { adminUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const snap = batchSnapshot(b);
    const hasOrders = b._count.orderItems > 0;
    return {
      ...toListItem(b, today),
      harvestDate: snap.harvestDate,
      inputKg: b.inputKg,
      purchase: snap.purchase,
      shelfLifeDays: b.shelfLifeDays,
      attributes: snap.attributes,
      quality: snap.quality,
      hasOrders,
      lockedFields: hasOrders ? [...LOCKED_AFTER_ORDERS] : [],
      products: b.products.map((p) => toAdminProduct(p, b)),
      stockAdjustments: b.stockAdjustments.map(toStockAdjustment),
      audit: audit.map(toAuditEntry),
      category: toCategory(b.category),
    };
  }

  async create(adminId: string, input: BatchCreateData): Promise<AdminBatchDetail> {
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category || !category.isActive) throw validationError([{ path: "categoryId", message: "Unknown or inactive category" }]);
    await this.checkPeople(input.categoryId as CategoryId, input.farmerId, input.partnerId);
    const products = input.products.map((p, i) => this.priceProduct(category, p, `products.${i}`));

    // The id is printed on packs and must be unique: try the variety code, then others.
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = await this.nextBatchId(input.packedDate, input.variety);
      try {
        await this.prisma.$transaction(async (tx) => {
          const batch = await tx.batch.create({ data: { id, ...this.batchData(input), availableKg: input.outputKg } });
          await this.audit.record(tx, { adminId, entity: "Batch", entityId: id, action: "CREATE", changes: created(batchSnapshot(batch)) });
          for (const p of products) await this.insertProduct(tx, adminId, id, input.variety, p);
        });
        return this.get(id);
      } catch (e) {
        const target = (e as Prisma.PrismaClientKnownRequestError).meta?.target;
        const idClash = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && JSON.stringify(target).includes("id");
        if (!idClash) throw e; // another admin took this id at the same moment: try the next one
      }
    }
    throw new ConflictException("Couldn't allocate a batch id; please try again");
  }

  async update(adminId: string, id: string, input: BatchUpdateData): Promise<AdminBatchDetail> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const current = await this.prisma.batch.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } });
    if (!current) throw new NotFoundException("Batch not found");
    const before = batchSnapshot(current);

    if (current._count.orderItems > 0) {
      const changed = LOCKED_AFTER_ORDERS.filter((f) => input[f] !== undefined && input[f] !== before[f]);
      if (changed.length) throw new ConflictException(`This batch has orders, so ${changed.join(", ")} can't change`);
    }

    const merged: BatchFields & { farmerId: string; partnerId: string } = {
      ...before,
      ...input,
      purchase: input.purchase !== undefined ? input.purchase : before.purchase,
      shelfLifeDays: input.shelfLifeDays !== undefined ? input.shelfLifeDays : before.shelfLifeDays,
    };
    const issues = batchIssues(merged);
    if (issues.length) throw validationError(issues);
    if (input.farmerId || input.partnerId) await this.checkPeople(current.categoryId as CategoryId, merged.farmerId, merged.partnerId);

    // Stock already sold or adjusted stays sold: output changes move availableKg by the same amount.
    const availableKg = current.availableKg + (merged.outputKg - current.outputKg);
    if (availableKg < 0) {
      throw new ConflictException(`Output can't go below ${current.outputKg - current.availableKg} kg already sold or written off`);
    }

    return this.prisma.$transaction(async (tx) => {
      const after = await tx.batch.update({ where: { id }, data: { ...this.batchData(merged), availableKg } });
      const changes = diff(before, batchSnapshot(after));
      if (Object.keys(changes).length) await this.audit.record(tx, { adminId, entity: "Batch", entityId: id, action: "UPDATE", changes });
      return id;
    }).then(() => this.get(id));
  }

  /**
   * Manual stock correction. One conditional UPDATE, so two adjustments at once can
   * never push stock below 0 or above the batch's output.
   */
  async adjustStock(adminId: string, id: string, input: z.output<typeof StockAdjustmentSchema>) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ availableKg: number; outputKg: number }[]>`
        UPDATE "Batch" SET "availableKg" = "availableKg" + ${input.deltaKg}, "updatedAt" = now()
        WHERE id = ${id} AND "availableKg" + ${input.deltaKg} >= 0 AND "availableKg" + ${input.deltaKg} <= "outputKg"
        RETURNING "availableKg", "outputKg"`;
      if (rows.length === 0) {
        const b = await tx.batch.findUnique({ where: { id }, select: { availableKg: true, outputKg: true } });
        if (!b) throw new NotFoundException("Batch not found");
        throw new ConflictException(
          input.deltaKg < 0
            ? `Only ${b.availableKg} kg in stock, so you can remove at most ${b.availableKg} kg`
            : `Stock can't exceed the batch output of ${b.outputKg} kg (now ${b.availableKg} kg)`,
        );
      }
      const after = rows[0].availableKg;
      const adjustment = await tx.stockAdjustment.create({
        data: {
          batchId: id,
          adminUserId: adminId,
          deltaKg: input.deltaKg,
          reason: input.reason,
          note: input.note || null,
          availableBefore: after - input.deltaKg,
          availableAfter: after,
        },
        include: { adminUser: { select: { id: true, name: true } } },
      });
      await this.audit.record(tx, {
        adminId,
        entity: "Batch",
        entityId: id,
        action: "STOCK_ADJUST",
        changes: {
          availableKg: { before: after - input.deltaKg, after },
          reason: { before: null, after: input.reason },
          ...(input.note ? { note: { before: null, after: input.note } } : {}),
        },
      });
      return { availableKg: after, adjustment: toStockAdjustment(adjustment) };
    });
  }

  // ---------- Products ----------

  async addProduct(adminId: string, batchId: string, input: ProductInputData): Promise<AdminProduct> {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId }, include: { category: true } });
    if (!batch) throw new NotFoundException("Batch not found");
    const priced = this.priceProduct(batch.category, input, "");
    const product = await this.prisma.$transaction((tx) => this.insertProduct(tx, adminId, batchId, batch.variety, priced));
    return toAdminProduct(product, batch);
  }

  async updateProduct(adminId: string, id: string, input: ProductUpdateData): Promise<AdminProduct> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const current = await this.prisma.product.findUnique({ where: { id }, include: { batch: true } });
    if (!current) throw new NotFoundException("Product not found");
    const before = productSnapshot(current);
    const parts = {
      farmerShare: input.farmerShare ?? before.farmerShare,
      partnerShare: input.partnerShare ?? before.partnerShare,
      platformFee: input.platformFee ?? before.platformFee,
      price: input.price ?? before.price,
    };
    if (!priceMatchesParts(parts)) throw this.priceError("", parts);

    return this.prisma.$transaction(async (tx) => {
      const after = await tx.product.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
          ...(input.featured !== undefined ? { featured: input.featured } : {}),
          farmerSharePaise: toPaise(parts.farmerShare),
          partnerSharePaise: toPaise(parts.partnerShare),
          platformFeePaise: toPaise(parts.platformFee),
          pricePaise: toPaise(parts.price),
        },
        include: { _count: { select: { orderItems: true } } },
      });
      const changes = diff(before, productSnapshot(after));
      if (Object.keys(changes).length) await this.audit.record(tx, { adminId, entity: "Product", entityId: id, action: "UPDATE", changes });
      return toAdminProduct(after, current.batch);
    });
  }

  async setProductActive(adminId: string, id: string, isActive: boolean): Promise<AdminProduct> {
    const current = await this.prisma.product.findUnique({ where: { id }, include: { batch: true, _count: { select: { orderItems: true } } } });
    if (!current) throw new NotFoundException("Product not found");
    if (current.isActive === isActive) return toAdminProduct(current, current.batch);
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.product.update({ where: { id }, data: { isActive }, include: { _count: { select: { orderItems: true } } } });
      await this.audit.record(tx, {
        adminId,
        entity: "Product",
        entityId: id,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        changes: { isActive: { before: !isActive, after: isActive } },
      });
      return toAdminProduct(after, current.batch);
    });
  }

  // ---------- Helpers ----------

  private batchData(b: BatchFields & { farmerId: string; partnerId: string }) {
    return {
      categoryId: b.categoryId,
      salesModel: b.salesModel,
      farmerId: b.farmerId,
      partnerId: b.partnerId,
      variety: b.variety,
      harvestDate: dateValue(b.harvestDate),
      packedDate: dateValue(b.packedDate),
      inputKg: b.inputKg,
      outputKg: b.outputKg,
      purchaseDate: b.purchase ? dateValue(b.purchase.date) : null,
      purchasePricePerKgPaise: b.purchase ? toPaise(b.purchase.pricePerKg) : null,
      shelfLifeDays: b.shelfLifeDays ?? null,
      expiresOn: b.shelfLifeDays ? addDays(dateValue(b.packedDate), b.shelfLifeDays) : null,
      attributes: b.attributes as Prisma.InputJsonObject,
      quality: b.quality as Prisma.InputJsonObject,
    };
  }

  /** The farmer and partner must exist and be active, and the partner must process this crop. */
  private async checkPeople(categoryId: CategoryId, farmerId: string, partnerId: string) {
    const [farmer, partner] = await Promise.all([
      this.prisma.farmer.findUnique({ where: { id: farmerId } }),
      this.prisma.partner.findUnique({ where: { id: partnerId } }),
    ]);
    const issues: { path: string; message: string }[] = [];
    if (!farmer || !farmer.isActive) issues.push({ path: "farmerId", message: "Choose an active farmer" });
    if (!partner || !partner.isActive) issues.push({ path: "partnerId", message: "Choose an active partner" });
    else if (isCategoryId(categoryId) && partner.type !== CROPS[categoryId].partnerType) {
      issues.push({ path: "partnerId", message: `${categoryId} needs a ${CROPS[categoryId].partnerType.toLowerCase()}` });
    }
    if (issues.length) throw validationError(issues);
  }

  /** Pack size must be one of the category's; platform fee defaults from the category; price must equal the parts. */
  private priceProduct(category: Category, p: ProductInputData, path: string) {
    const at = (f: string) => (path ? `${path}.${f}` : f);
    if (!category.packSizesKg.includes(p.bagSizeKg)) {
      throw validationError([{ path: at("bagSizeKg"), message: `Pack size must be one of ${category.packSizesKg.join(", ")} kg` }]);
    }
    const platformFee = p.platformFee ?? (category.platformFeePerKgPaise * p.bagSizeKg) / 100;
    const parts = { farmerShare: p.farmerShare, partnerShare: p.partnerShare, platformFee, price: p.price };
    if (!priceMatchesParts(parts)) throw this.priceError(path, parts);
    return { ...p, platformFee };
  }

  private priceError(path: string, p: { farmerShare: number; partnerShare: number; platformFee: number; price: number }) {
    const sum = (toPaise(p.farmerShare) + toPaise(p.partnerShare) + toPaise(p.platformFee)) / 100;
    return validationError([
      { path: path ? `${path}.price` : "price", message: `Price must equal farmer + partner + platform = ₹${sum} (got ₹${p.price})` },
    ]);
  }

  private async insertProduct(
    tx: Prisma.TransactionClient,
    adminId: string,
    batchId: string,
    variety: string,
    p: ProductInputData & { platformFee: number },
  ) {
    const slug = await this.uniqueSlug(tx, `${p.name}-${p.bagSizeKg}kg`, variety);
    const product = await tx.product.create({
      data: {
        slug,
        name: p.name,
        batchId,
        bagSizeKg: p.bagSizeKg,
        farmerSharePaise: toPaise(p.farmerShare),
        partnerSharePaise: toPaise(p.partnerShare),
        platformFeePaise: toPaise(p.platformFee),
        pricePaise: toPaise(p.price),
        description: p.description,
        tags: p.tags,
        featured: p.featured,
      },
      include: { _count: { select: { orderItems: true } } },
    });
    await this.audit.record(tx, { adminId, entity: "Product", entityId: product.id, action: "CREATE", changes: created(productSnapshot(product)) });
    return product;
  }

  private async uniqueSlug(tx: Prisma.TransactionClient, text: string, fallback: string) {
    const base = slugify(text) || slugify(fallback) || "product";
    const taken = new Set(
      (await tx.product.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((p) => p.slug),
    );
    if (!taken.has(base)) return base;
    for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }

  /** KS-YYYY-MMDD-XX from the packed date and variety, skipping ids already in use. */
  private async nextBatchId(packedDate: string, variety: string) {
    const [y, m, d] = packedDate.split("-");
    const prefix = `KS-${y}-${m}${d}-`;
    const taken = new Set(
      (await this.prisma.batch.findMany({ where: { id: { startsWith: prefix } }, select: { id: true } })).map((b) => b.id),
    );
    const free = batchSuffixCandidates(variety).find((s) => !taken.has(prefix + s));
    if (!free) throw new ConflictException("No batch ids left for this date");
    return prefix + free;
  }
}

@ApiTags("admin: batches & products")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin")
export class BatchesController {
  constructor(private readonly batches: BatchesService) {}

  @Get("batches")
  @ApiOperation({ summary: "Batches with filters (category, sales model, farmer, partner, stock status, expiring soon)." })
  list(@Query(new ZodValidationPipe(BatchListQuerySchema)) q: BatchListQuery) {
    return this.batches.list(q);
  }

  @Get("batches/:id")
  @ApiOperation({ summary: "A batch with its products, stock history and audit history." })
  get(@Param("id", IdPipe) id: string) {
    return this.batches.get(id);
  }

  @Post("batches")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create a batch (id generated as KS-YYYY-MMDD-XX), optionally with its products." })
  @ZodApiBody(BatchCreateSchema)
  create(@CurrentAdmin() admin: AuthAdmin, @Body(new ZodValidationPipe(BatchCreateSchema)) body: BatchCreateInput) {
    return this.batches.create(admin.id, body as BatchCreateData);
  }

  @Patch("batches/:id")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update a batch. salesModel, farmer, partner and outputKg are locked once it has orders." })
  @ZodApiBody(BatchUpdateSchema)
  update(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(BatchUpdateSchema)) body: BatchUpdateData,
  ) {
    return this.batches.update(admin.id, id, body);
  }

  @Post("batches/:id/stock")
  @Roles("ADMIN", "STAFF")
  @ApiOperation({ summary: "Adjust stock by a signed kg amount with a reason. Never below 0 or above the batch output." })
  @ZodApiBody(StockAdjustmentSchema)
  adjustStock(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(StockAdjustmentSchema)) body: StockAdjustmentInput,
  ) {
    return this.batches.adjustStock(admin.id, id, body as z.output<typeof StockAdjustmentSchema>);
  }

  @Post("batches/:id/products")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Add a pack to a batch. Platform fee defaults from the category; price must equal the parts." })
  @ZodApiBody(ProductInputSchema)
  addProduct(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(ProductInputSchema)) body: ProductInputData,
  ) {
    return this.batches.addProduct(admin.id, id, body);
  }

  @Patch("products/:id")
  @Roles("ADMIN")
  @ZodApiBody(ProductUpdateSchema)
  updateProduct(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(ProductUpdateSchema)) body: ProductUpdateData,
  ) {
    return this.batches.updateProduct(admin.id, id, body);
  }

  @Post("products/:id/deactivate")
  @Roles("ADMIN")
  deactivateProduct(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.batches.setProductActive(admin.id, id, false);
  }

  @Post("products/:id/reactivate")
  @Roles("ADMIN")
  reactivateProduct(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.batches.setProductActive(admin.id, id, true);
  }
}
