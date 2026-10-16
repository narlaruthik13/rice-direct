// Environment for apps/api, validated once at startup. A missing or weak value stops
// the server before it accepts traffic, with a message naming the variable (never its value).
import { z } from "zod";

const required = (what = "string") =>
  z.string({ error: (issue) => (issue.input === undefined ? "is required" : `must be a ${what}`) }).trim();

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: required().refine((v) => /^postgres(ql)?:\/\//.test(v), "must be a postgresql:// URL"),
    JWT_ACCESS_SECRET: required().pipe(z.string().min(32, "must be at least 32 characters")),
    JWT_REFRESH_SECRET: required().pipe(z.string().min(32, "must be at least 32 characters")),
    CORS_ORIGINS: required()
      .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean))
      .pipe(z.array(z.url("must be a comma-separated list of URLs")).min(1, "needs at least one origin")),
  })
  .refine((e) => e.JWT_ACCESS_SECRET !== e.JWT_REFRESH_SECRET, {
    message: "must be different from JWT_ACCESS_SECRET",
    path: ["JWT_REFRESH_SECRET"],
  });

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join(".") || "environment"}: ${i.message}`);
    throw new Error(`Invalid API environment (see apps/api/.env.example):\n${lines.join("\n")}`);
  }
  return result.data;
}
