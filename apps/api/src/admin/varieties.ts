import { Body, ConflictException, Controller, Get, Injectable, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@kisa/db";
import { type AdminVariety, type Paginated, type VarietyListQuery, VarietyListQuerySchema, VarietyInputSchema, VarietyUpdateSchema } from "@kisa/shared";
import type { z } from "zod";
import type { AuthAdmin } from "../auth/auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { toAdminVariety } from "./admin-mappers";
import { AuditService, created, diff } from "./audit";
import { IdPipe, nothingToUpdate, slugify, validationError } from "./common";

const snapshot = (v: AdminVariety) => ({ categoryId: v.categoryId, name: v.name, slug: v.slug, isActive: v.isActive });
const withCount = { _count: { select: { batches: true } } } as const;
const isUniqueClash = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** The admin-managed list of varieties (Sona Masoori, BPT 5204, HMT, ...). */
@Injectable()
export class VarietiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: VarietyListQuery): Promise<Paginated<AdminVariety>> {
    const where: Prisma.VarietyWhereInput = {
      ...(q.status === "all" ? {} : { isActive: q.status === "active" }),
      ...(q.category ? { categoryId: q.category } : {}),
      ...(q.search ? { name: { contains: q.search, mode: "insensitive" } } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.variety.count({ where }),
      this.prisma.variety.findMany({
        where,
        include: withCount,
        orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return { items: rows.map(toAdminVariety), total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string): Promise<AdminVariety> {
    const v = await this.prisma.variety.findUnique({ where: { id }, include: withCount });
    if (!v) throw new NotFoundException("Variety not found");
    return toAdminVariety(v);
  }

  async create(adminId: string, input: z.output<typeof VarietyInputSchema>): Promise<AdminVariety> {
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw validationError([{ path: "categoryId", message: "Unknown category" }]);
    const slug = slugify(input.name);
    if (!slug) throw validationError([{ path: "name", message: "Use letters or numbers in the name" }]);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const v = toAdminVariety(await tx.variety.create({ data: { categoryId: input.categoryId, name: input.name, slug }, include: withCount }));
        await this.audit.record(tx, { adminId, entity: "Variety", entityId: v.id, action: "CREATE", changes: created(snapshot(v)) });
        return v;
      });
    } catch (e) {
      if (isUniqueClash(e)) throw new ConflictException(`A variety called "${input.name}" already exists`);
      throw e;
    }
  }

  /** Renames keep the slug: it is used in website links and filters. */
  async update(adminId: string, id: string, input: z.output<typeof VarietyUpdateSchema>): Promise<AdminVariety> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const before = await this.get(id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const after = toAdminVariety(await tx.variety.update({ where: { id }, data: input, include: withCount }));
        const changes = diff(snapshot(before), snapshot(after));
        if (Object.keys(changes).length) await this.audit.record(tx, { adminId, entity: "Variety", entityId: id, action: "UPDATE", changes });
        return after;
      });
    } catch (e) {
      if (isUniqueClash(e)) throw new ConflictException(`A variety called "${input.name}" already exists`);
      throw e;
    }
  }

  /** Soft delete. An inactive variety's products disappear from the shop. */
  async setActive(adminId: string, id: string, isActive: boolean): Promise<AdminVariety> {
    const before = await this.get(id);
    if (before.isActive === isActive) return before;
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminVariety(await tx.variety.update({ where: { id }, data: { isActive }, include: withCount }));
      await this.audit.record(tx, {
        adminId,
        entity: "Variety",
        entityId: id,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        changes: { isActive: { before: !isActive, after: isActive } },
      });
      return after;
    });
  }
}

@ApiTags("admin: varieties")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/varieties")
export class VarietiesController {
  constructor(private readonly varieties: VarietiesService) {}

  @Get()
  @ApiOperation({ summary: "Varieties with search, category and status filters." })
  list(@Query(new ZodValidationPipe(VarietyListQuerySchema)) q: VarietyListQuery) {
    return this.varieties.list(q);
  }

  @Get(":id")
  get(@Param("id", IdPipe) id: string) {
    return this.varieties.get(id);
  }

  @Post()
  @Roles("ADMIN")
  @ZodApiBody(VarietyInputSchema)
  create(@CurrentAdmin() admin: AuthAdmin, @Body(new ZodValidationPipe(VarietyInputSchema)) body: z.output<typeof VarietyInputSchema>) {
    return this.varieties.create(admin.id, body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ZodApiBody(VarietyUpdateSchema)
  update(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(VarietyUpdateSchema)) body: z.output<typeof VarietyUpdateSchema>,
  ) {
    return this.varieties.update(admin.id, id, body);
  }

  @Post(":id/deactivate")
  @Roles("ADMIN")
  deactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.varieties.setActive(admin.id, id, false);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  reactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.varieties.setActive(admin.id, id, true);
  }
}
