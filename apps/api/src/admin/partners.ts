import { Body, ConflictException, Controller, Get, Injectable, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Prisma } from "@kisa/db";
import { type AdminPartner, type Paginated, type PartnerListQuery, PartnerListQuerySchema, PartnerInputSchema, PartnerUpdateSchema } from "@kisa/shared";
import type { z } from "zod";
import type { AuthAdmin } from "../auth/auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { toAdminPartner } from "./admin-mappers";
import { AuditService, created, diff } from "./audit";
import { IdPipe, nothingToUpdate, toPaise } from "./common";

type PartnerData = Partial<z.output<typeof PartnerInputSchema>>;

const toDb = (input: PartnerData): Prisma.PartnerUpdateInput => {
  const { processingFeePerKg, ...rest } = input;
  return { ...rest, ...(processingFeePerKg !== undefined ? { processingFeePerKgPaise: toPaise(processingFeePerKg) } : {}) };
};

const snapshot = (p: AdminPartner) => ({
  type: p.type,
  name: p.name,
  phone: p.phone,
  town: p.town,
  district: p.district,
  state: p.state,
  processingFeePerKg: p.processingFeePerKg,
  certifications: p.certifications,
  established: p.established,
  isActive: p.isActive,
});

const withCount = { _count: { select: { batches: true } } } as const;
const SORT_COLUMN = { name: "name", town: "town", processingFeePerKg: "processingFeePerKgPaise", createdAt: "createdAt" } as const;

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: PartnerListQuery): Promise<Paginated<AdminPartner>> {
    const where: Prisma.PartnerWhereInput = {
      ...(q.status === "all" ? {} : { isActive: q.status === "active" }),
      ...(q.type ? { type: q.type } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" } },
              { town: { contains: q.search, mode: "insensitive" } },
              { district: { contains: q.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.partner.count({ where }),
      this.prisma.partner.findMany({
        where,
        include: withCount,
        orderBy: [{ [SORT_COLUMN[q.sort]]: q.order }, { id: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return { items: rows.map(toAdminPartner), total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string): Promise<AdminPartner> {
    const p = await this.prisma.partner.findUnique({ where: { id }, include: withCount });
    if (!p) throw new NotFoundException("Partner not found");
    return toAdminPartner(p);
  }

  async create(adminId: string, input: z.output<typeof PartnerInputSchema>): Promise<AdminPartner> {
    return this.prisma.$transaction(async (tx) => {
      const p = toAdminPartner(await tx.partner.create({ data: toDb(input) as Prisma.PartnerCreateInput, include: withCount }));
      await this.audit.record(tx, { adminId, entity: "Partner", entityId: p.id, action: "CREATE", changes: created(snapshot(p)) });
      return p;
    });
  }

  async update(adminId: string, id: string, input: PartnerData): Promise<AdminPartner> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const before = await this.get(id);
    // A mill's batches are rice and a packhouse's are onions; the type can't change under them.
    if (input.type && input.type !== before.type && before.batchCount > 0) {
      throw new ConflictException("The partner type can't change once the partner has batches");
    }
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminPartner(await tx.partner.update({ where: { id }, data: toDb(input), include: withCount }));
      const changes = diff(snapshot(before), snapshot(after));
      if (Object.keys(changes).length) {
        await this.audit.record(tx, { adminId, entity: "Partner", entityId: id, action: "UPDATE", changes });
      }
      return after;
    });
  }

  /** Soft delete: partners are never removed, only switched off (and back on). */
  async setActive(adminId: string, id: string, isActive: boolean): Promise<AdminPartner> {
    const before = await this.get(id);
    if (before.isActive === isActive) return before;
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminPartner(await tx.partner.update({ where: { id }, data: { isActive }, include: withCount }));
      await this.audit.record(tx, {
        adminId,
        entity: "Partner",
        entityId: id,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        changes: { isActive: { before: !isActive, after: isActive } },
      });
      return after;
    });
  }
}

@ApiTags("admin: partners")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/partners")
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Get()
  @ApiOperation({ summary: "Mills and packhouses with search, type and status filters, sorting and pagination." })
  list(@Query(new ZodValidationPipe(PartnerListQuerySchema)) q: PartnerListQuery) {
    return this.partners.list(q);
  }

  @Get(":id")
  get(@Param("id", IdPipe) id: string) {
    return this.partners.get(id);
  }

  @Post()
  @Roles("ADMIN")
  @ZodApiBody(PartnerInputSchema)
  create(@CurrentAdmin() admin: AuthAdmin, @Body(new ZodValidationPipe(PartnerInputSchema)) body: z.output<typeof PartnerInputSchema>) {
    return this.partners.create(admin.id, body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ZodApiBody(PartnerUpdateSchema)
  update(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(PartnerUpdateSchema)) body: PartnerData,
  ) {
    return this.partners.update(admin.id, id, body);
  }

  @Post(":id/deactivate")
  @Roles("ADMIN")
  deactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.partners.setActive(admin.id, id, false);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  reactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.partners.setActive(admin.id, id, true);
  }
}
