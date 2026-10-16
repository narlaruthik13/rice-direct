import { Body, Controller, Get, Injectable, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Prisma } from "@kisa/db";
import { type AdminMill, type MillListQuery, MillListQuerySchema, MillInputSchema, MillUpdateSchema, type Paginated } from "@kisa/shared";
import type { z } from "zod";
import type { AuthAdmin } from "../auth/auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { toAdminMill } from "./admin-mappers";
import { AuditService, created, diff } from "./audit";
import { IdPipe, nothingToUpdate } from "./common";

type MillData = Partial<z.output<typeof MillInputSchema>>;

const snapshot = (m: AdminMill) => ({
  name: m.name,
  contactName: m.contactName,
  phone: m.phone,
  town: m.town,
  district: m.district,
  state: m.state,
  fssaiLicense: m.fssaiLicense,
  certifications: m.certifications,
  isActive: m.isActive,
});

const withCount = { _count: { select: { batches: true } } } as const;

/** Partner mills: recorded for payouts and quality accountability, never shown publicly. */
@Injectable()
export class MillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: MillListQuery): Promise<Paginated<AdminMill>> {
    const where: Prisma.MillWhereInput = {
      ...(q.status === "all" ? {} : { isActive: q.status === "active" }),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" } },
              { town: { contains: q.search, mode: "insensitive" } },
              { district: { contains: q.search, mode: "insensitive" } },
              { contactName: { contains: q.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.mill.count({ where }),
      this.prisma.mill.findMany({
        where,
        include: withCount,
        orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return { items: rows.map(toAdminMill), total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string): Promise<AdminMill> {
    const m = await this.prisma.mill.findUnique({ where: { id }, include: withCount });
    if (!m) throw new NotFoundException("Mill not found");
    return toAdminMill(m);
  }

  async create(adminId: string, input: z.output<typeof MillInputSchema>): Promise<AdminMill> {
    return this.prisma.$transaction(async (tx) => {
      const m = toAdminMill(await tx.mill.create({ data: input, include: withCount }));
      await this.audit.record(tx, { adminId, entity: "Mill", entityId: m.id, action: "CREATE", changes: created(snapshot(m)) });
      return m;
    });
  }

  async update(adminId: string, id: string, input: MillData): Promise<AdminMill> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const before = await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminMill(await tx.mill.update({ where: { id }, data: input, include: withCount }));
      const changes = diff(snapshot(before), snapshot(after));
      if (Object.keys(changes).length) {
        await this.audit.record(tx, { adminId, entity: "Mill", entityId: id, action: "UPDATE", changes });
      }
      return after;
    });
  }

  /** Soft delete: mills are never removed, only switched off (and back on). */
  async setActive(adminId: string, id: string, isActive: boolean): Promise<AdminMill> {
    const before = await this.get(id);
    if (before.isActive === isActive) return before;
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminMill(await tx.mill.update({ where: { id }, data: { isActive }, include: withCount }));
      await this.audit.record(tx, {
        adminId,
        entity: "Mill",
        entityId: id,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        changes: { isActive: { before: !isActive, after: isActive } },
      });
      return after;
    });
  }
}

@ApiTags("admin: mills")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/mills")
export class MillsController {
  constructor(private readonly mills: MillsService) {}

  @Get()
  @ApiOperation({ summary: "Partner mills with search, status filter, sorting and pagination." })
  list(@Query(new ZodValidationPipe(MillListQuerySchema)) q: MillListQuery) {
    return this.mills.list(q);
  }

  @Get(":id")
  get(@Param("id", IdPipe) id: string) {
    return this.mills.get(id);
  }

  @Post()
  @Roles("ADMIN")
  @ZodApiBody(MillInputSchema)
  create(@CurrentAdmin() admin: AuthAdmin, @Body(new ZodValidationPipe(MillInputSchema)) body: z.output<typeof MillInputSchema>) {
    return this.mills.create(admin.id, body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ZodApiBody(MillUpdateSchema)
  update(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string, @Body(new ZodValidationPipe(MillUpdateSchema)) body: MillData) {
    return this.mills.update(admin.id, id, body);
  }

  @Post(":id/deactivate")
  @Roles("ADMIN")
  deactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.mills.setActive(admin.id, id, false);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  reactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.mills.setActive(admin.id, id, true);
  }
}
