import "./config/load-env"; // first: snapshot the environment before anything imports Prisma
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { API_PREFIX, configureApp, DOCS_PATH } from "./app.setup";
import { AppModule } from "./app.module";
import type { Env } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const port = config.get("PORT", { infer: true });
  await app.listen(port);

  const log = new Logger("Bootstrap");
  log.log(`Kisa API on http://localhost:${port}/${API_PREFIX}`);
  if (config.get("NODE_ENV", { infer: true }) !== "production") {
    log.log(`Swagger docs on http://localhost:${port}/${DOCS_PATH}`);
  }
}

bootstrap().catch((err: unknown) => {
  // Invalid env and other startup failures: print the reason and exit non-zero.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
