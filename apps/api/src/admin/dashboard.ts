import { Controller, Get, Injectable, Module, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { DashboardSummary } from "@kisa/shared";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { AuthModule } from "../auth/auth.module";
import { sellable } from "../catalogue/catalogue.service";
import { addDays, daysBetween, isoDate, startOfTodayInIndia, todayInIndia, todayInIndiaIso } from "../common/dates";
import { PrismaService } from "../prisma/prisma.service";

const LIST_SIZE = 5;
const BEST_BEFORE_WINDOW_DAYS = 30;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const today = todayInIndia();

    // Active = switched on and from a batch that can still be sold (category and variety active, before best-before).
    const [products, ordersToday, nearBestBefore] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true, batch: sellable(today) },
        include: { batch: { include: { variety: { select: { name: true } } } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfTodayInIndia() } } }),
      this.prisma.batch.findMany({
        where: {
          category: { isActive: true },
          availableKg: { gt: 0 },
          bestBefore: { gt: today, lte: addDays(today, BEST_BEFORE_WINDOW_DAYS) },
        },
        include: { variety: { select: { name: true } } },
        orderBy: [{ bestBefore: "asc" }, { packedDate: "asc" }],
      }),
    ]);

    const inStock = products.filter((p) => p.batch.availableKg >= p.bagSizeKg);
    const soldOut = products.filter((p) => p.batch.availableKg < p.bagSizeKg);

    // Low stock is per batch: at least 1 but fewer than 2 of its smallest active pack left.
    const byBatch = new Map<string, typeof products>();
    for (const p of products) byBatch.set(p.batchId, [...(byBatch.get(p.batchId) ?? []), p]);
    const lowStock = [...byBatch.values()]
      .map((packs) => {
        const batch = packs[0].batch;
        const packSizeKg = Math.min(...packs.map((p) => p.bagSizeKg));
        return {
          batchId: batch.id,
          variety: batch.variety.name,
          products: packs.map((p) => p.name),
          availableKg: batch.availableKg,
          packSizeKg,
          packsLeft: Math.floor(batch.availableKg / packSizeKg),
        };
      })
      .filter((b) => b.packsLeft >= 1 && b.packsLeft < 2)
      .sort((a, b) => a.availableKg / a.packSizeKg - b.availableKg / b.packSizeKg);

    return {
      today: todayInIndiaIso(),
      generatedAt: new Date().toISOString(),
      ordersToday,
      products: { active: products.length, inStock: inStock.length, soldOut: soldOut.length },
      soldOut: {
        count: soldOut.length,
        items: soldOut.slice(0, LIST_SIZE).map((p) => ({ slug: p.slug, name: p.name, batchId: p.batchId })),
      },
      lowStock: { count: lowStock.length, items: lowStock.slice(0, LIST_SIZE) },
      bestBeforeSoon: {
        count: nearBestBefore.length,
        items: nearBestBefore.slice(0, LIST_SIZE).map((b) => ({
          batchId: b.id,
          variety: b.variety.name,
          bestBefore: isoDate(b.bestBefore),
          daysLeft: daysBetween(today, b.bestBefore),
          availableKg: b.availableKg,
        })),
      },
    };
  }
}

@ApiTags("admin")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "STAFF")
@Controller("admin/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  @ApiOperation({ summary: "Counts and short lists for the admin dashboard: stock, low stock, best-before within 30 days, orders today." })
  summary(): Promise<DashboardSummary> {
    return this.dashboard.summary();
  }
}

@Module({ imports: [AuthModule], controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
