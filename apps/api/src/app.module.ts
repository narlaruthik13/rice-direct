import { startupEnv } from "./config/load-env"; // first: before anything imports Prisma
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { DashboardModule } from "./admin/dashboard";
import { AuthModule } from "./auth/auth.module";
import { CatalogueModule } from "./catalogue/catalogue.controller";
import { validateEnv } from "./config/env";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.service";

@Module({
  imports: [
    // Validates the environment snapshot from load-env.ts; startup fails if anything is missing or invalid.
    ConfigModule.forRoot({ isGlobal: true, cache: true, ignoreEnvFile: true, validate: () => validateEnv(startupEnv) }),
    // Default: 120 requests per minute per IP. Login and refresh have stricter limits.
    ThrottlerModule.forRoot({ throttlers: [{ name: "default", ttl: 60_000, limit: 120 }] }),
    PrismaModule,
    AuthModule,
    CatalogueModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
