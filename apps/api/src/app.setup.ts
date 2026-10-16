// HTTP setup shared by main.ts and the e2e tests, so tests run the real security config.
import { randomUUID } from "node:crypto";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import type { Env } from "./config/env";

export const API_PREFIX = "api/v1";
export const DOCS_PATH = "api/docs";

export function configureApp(app: NestExpressApplication) {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const isProd = config.get("NODE_ENV", { infer: true }) === "production";
  const origins = new Set(config.get("CORS_ORIGINS", { infer: true }));

  app.setGlobalPrefix(API_PREFIX);

  // Railway / Render put one proxy in front; trust it so rate limits see the real client IP.
  if (isProd) app.set("trust proxy", 1);

  // The API serves JSON only. CSP is relaxed outside production so Swagger UI can load.
  app.use(helmet({ contentSecurityPolicy: isProd ? undefined : false }));

  // Only listed browser origins get CORS headers. Requests without an Origin (curl, servers) are unaffected.
  app.enableCors({
    origin: (origin, done) => done(null, !origin || origins.has(origin)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    maxAge: 600,
  });

  // A request id on every response (and in error bodies) to match client reports with server logs.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers["x-request-id"];
    const id = typeof incoming === "string" && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    req.headers["x-request-id"] = id;
    res.setHeader("X-Request-Id", id);
    next();
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (!isProd) {
    const doc = new DocumentBuilder()
      .setTitle("Kisa API")
      .setDescription("Catalogue, trace and admin API. Money is in rupees; dates are YYYY-MM-DD.")
      .setVersion("v1")
      .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
      .build();
    SwaggerModule.setup(DOCS_PATH, app, SwaggerModule.createDocument(app, doc), {
      swaggerOptions: { persistAuthorization: true },
    });
  }
}
