import { Controller, Get, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { HealthResponse } from "@kisa/shared";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("health")
@SkipThrottle()
@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Liveness and database check. 503 when the database is unreachable." })
  async check(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      this.logger.error("Database check failed", e instanceof Error ? e.stack : String(e));
      throw new ServiceUnavailableException("Database unavailable");
    }
    return { status: "ok", database: "up", uptimeSeconds: Math.round(process.uptime()) };
  }
}
