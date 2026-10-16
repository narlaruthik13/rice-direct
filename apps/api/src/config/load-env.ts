// Loads apps/api/.env and snapshots the environment BEFORE anything imports Prisma.
// Prisma Client auto-loads packages/db/.env when it is imported; validating this
// snapshot means the API fails fast on missing settings instead of silently running
// on another package's values. Must be the first import of main.ts and app.module.ts.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const file = join(__dirname, "..", "..", ".env"); // src/config or dist/config -> apps/api/.env
if (existsSync(file)) {
  // Assign directly (not process.loadEnvFile) so it also works in Jest's sandboxed process.env.
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
    if (process.env[key] === undefined) process.env[key] = value; // the host's variables win
  }
}

export const startupEnv: Readonly<Record<string, string | undefined>> = { ...process.env };
