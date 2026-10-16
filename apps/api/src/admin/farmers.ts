import { Body, Controller, Get, Injectable, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { FarmingMethod, Prisma } from "@kisa/db";
import {
  type AdminFarmer,
  type FarmerListQuery,
  FarmerListQuerySchema,
  FarmerInputSchema,
  FarmerUpdateSchema,
  type Paginated,
} from "@kisa/shared";
import type { z } from "zod";
import type { AuthAdmin } from "../auth/auth.types";
import { CurrentAdmin, JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { ZodApiBody, ZodValidationPipe } from "../common/zod";
import { PrismaService } from "../prisma/prisma.service";
import { toAdminFarmer } from "./admin-mappers";
import { AuditService, created, diff } from "./audit";
import { IdPipe, nothingToUpdate } from "./common";

const METHOD_TO_DB: Record<z.output<typeof FarmerInputSchema>["method"], FarmingMethod> = {
  conventional: "CONVENTIONAL",
  "low-chemical": "LOW_CHEMICAL",
  natural: "NATURAL",
};

type FarmerData = Partial<z.output<typeof FarmerInputSchema>>;

const toDb = (input: FarmerData): Prisma.FarmerUpdateInput => {
  const { method, ...rest } = input;
  return { ...rest, ...(method ? { method: METHOD_TO_DB[method] } : {}) };
};

/** The fields an admin edits, in API units, for audit snapshots. */
const snapshot = (f: AdminFarmer) => ({
  name: f.name,
  phone: f.phone,
  village: f.village,
  district: f.district,
  state: f.state,
  acres: f.acres,
  yearsFarming: f.yearsFarming,
  method: f.method,
  story: f.story,
  photoUrl: f.photoUrl,
  isActive: f.isActive,
});

const withCount = { _count: { select: { batches: true } } } as const;

@Injectable()
export class FarmersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: FarmerListQuery): Promise<Paginated<AdminFarmer>> {
    const where: Prisma.FarmerWhereInput = {
      ...(q.status === "all" ? {} : { isActive: q.status === "active" }),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" } },
              { village: { contains: q.search, mode: "insensitive" } },
              { district: { contains: q.search, mode: "insensitive" } },
              { phone: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.farmer.count({ where }),
      this.prisma.farmer.findMany({
        where,
        include: withCount,
        orderBy: [{ [q.sort]: q.order }, { id: "asc" }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return { items: rows.map(toAdminFarmer), total, page: q.page, pageSize: q.pageSize };
  }

  async get(id: string): Promise<AdminFarmer> {
    const f = await this.prisma.farmer.findUnique({ where: { id }, include: withCount });
    if (!f) throw new NotFoundException("Farmer not found");
    return toAdminFarmer(f);
  }

  async create(adminId: string, input: z.output<typeof FarmerInputSchema>): Promise<AdminFarmer> {
    return this.prisma.$transaction(async (tx) => {
      const f = toAdminFarmer(
        await tx.farmer.create({ data: toDb(input) as Prisma.FarmerCreateInput, include: withCount }),
      );
      await this.audit.record(tx, { adminId, entity: "Farmer", entityId: f.id, action: "CREATE", changes: created(snapshot(f)) });
      return f;
    });
  }

  async update(adminId: string, id: string, input: FarmerData): Promise<AdminFarmer> {
    if (Object.keys(input).length === 0) throw nothingToUpdate();
    const before = await this.get(id);
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminFarmer(await tx.farmer.update({ where: { id }, data: toDb(input), include: withCount }));
      const changes = diff(snapshot(before), snapshot(after));
      if (Object.keys(changes).length) {
        await this.audit.record(tx, { adminId, entity: "Farmer", entityId: id, action: "UPDATE", changes });
      }
      return after;
    });
  }

  /** Soft delete: farmers are never removed, only switched off (and back on). */
  async setActive(adminId: string, id: string, isActive: boolean): Promise<AdminFarmer> {
    const before = await this.get(id);
    if (before.isActive === isActive) return before;
    return this.prisma.$transaction(async (tx) => {
      const after = toAdminFarmer(await tx.farmer.update({ where: { id }, data: { isActive }, include: withCount }));
      await this.audit.record(tx, {
        adminId,
        entity: "Farmer",
        entityId: id,
        action: isActive ? "REACTIVATE" : "DEACTIVATE",
        changes: { isActive: { before: !isActive, after: isActive } },
      });
      return after;
    });
  }
}

@ApiTags("admin: farmers")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/farmers")
export class FarmersController {
  constructor(private readonly farmers: FarmersService) {}

  @Get()
  @ApiOperation({ summary: "Farmers with search, status filter, sorting and pagination." })
  list(@Query(new ZodValidationPipe(FarmerListQuerySchema)) q: FarmerListQuery) {
    return this.farmers.list(q);
  }

  @Get(":id")
  get(@Param("id", IdPipe) id: string) {
    return this.farmers.get(id);
  }

  @Post()
  @Roles("ADMIN")
  @ZodApiBody(FarmerInputSchema)
  create(@CurrentAdmin() admin: AuthAdmin, @Body(new ZodValidationPipe(FarmerInputSchema)) body: z.output<typeof FarmerInputSchema>) {
    return this.farmers.create(admin.id, body);
  }

  @Patch(":id")
  @Roles("ADMIN")
  @ZodApiBody(FarmerUpdateSchema)
  update(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id", IdPipe) id: string,
    @Body(new ZodValidationPipe(FarmerUpdateSchema)) body: FarmerData,
  ) {
    return this.farmers.update(admin.id, id, body);
  }

  @Post(":id/deactivate")
  @Roles("ADMIN")
  deactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.farmers.setActive(admin.id, id, false);
  }

  @Post(":id/reactivate")
  @Roles("ADMIN")
  reactivate(@CurrentAdmin() admin: AuthAdmin, @Param("id", IdPipe) id: string) {
    return this.farmers.setActive(admin.id, id, true);
  }
}
