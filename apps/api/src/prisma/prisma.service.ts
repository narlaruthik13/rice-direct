import { Global, Injectable, Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@kisa/db";
import type { Env } from "../config/env";

/** The API's single Prisma client (pooled DATABASE_URL), connected on startup. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // The validated URL is passed explicitly, so Prisma never falls back to packages/db/.env.
  constructor(config: ConfigService<Env, true>) {
    super({ datasourceUrl: config.get("DATABASE_URL", { infer: true }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
