/**
 * Creates an admin user (ADMIN or STAFF) in the database from packages/db/.env.
 *
 *   pnpm --filter @kisa/db db:create-admin -- --email staff@example.com --name "Ravi" --role STAFF
 *
 * Missing flags are asked for. The password is typed in a hidden prompt (twice) and is
 * never printed; only its bcrypt hash is stored. Refuses to touch an existing email.
 * Run it in PowerShell, cmd or Windows Terminal (Git Bash's mintty can't hide input).
 */
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const MIN_PASSWORD = 10;

// Piped input (e.g. CI): one reader for all lines, so no line is lost between prompts.
let pipedLines: AsyncIterator<string> | undefined;
async function nextPipedLine(): Promise<string> {
  pipedLines ??= createInterface({ input: process.stdin, terminal: false })[Symbol.asyncIterator]();
  const { value, done } = await pipedLines.next();
  if (done) throw new Error("Input ended before the password was entered.");
  return value;
}

/** Reads a line without echoing it (raw terminal mode). Falls back to plain stdin when piped. */
function askHidden(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY) return nextPipedLine(); // nothing is echoed: there is no terminal
  process.stdout.write(question);
  return new Promise((resolve, reject) => {
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          return reject(new Error("Cancelled"));
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function ask(question: string): Promise<string> {
  if (!process.stdin.isTTY) return (await nextPipedLine()).trim();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

async function main() {
  // `pnpm db:create-admin -- --email ...` passes the "--" through; drop it.
  const args = process.argv.slice(2).filter((a, i) => !(i === 0 && a === "--"));
  const { values } = parseArgs({
    args,
    options: { email: { type: "string" }, name: { type: "string" }, role: { type: "string" } },
  });
  const email = (values.email ?? (await ask("Email: "))).trim().toLowerCase();
  const name = (values.name ?? (await ask("Name: "))).trim();
  const role = (values.role ?? (await ask("Role (ADMIN or STAFF): "))).trim().toUpperCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That email doesn't look right.");
  if (name.length < 2) throw new Error("Name must be at least 2 characters.");
  if (role !== "ADMIN" && role !== "STAFF") throw new Error("Role must be ADMIN or STAFF.");

  const prisma = new PrismaClient();
  try {
    if (await prisma.adminUser.findUnique({ where: { email } })) {
      throw new Error(`An admin with ${email} already exists. Nothing was changed.`);
    }
    const password = await askHidden(`Password for ${email} (hidden, at least ${MIN_PASSWORD} characters): `);
    if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);
    const again = await askHidden("Type the password again: ");
    if (again !== password) throw new Error("The passwords don't match. Nothing was changed.");

    await prisma.adminUser.create({ data: { email, name, role, passwordHash: await bcrypt.hash(password, 12) } });
    const host = new URL(process.env.DATABASE_URL ?? "postgresql://unknown").hostname.split(".")[0];
    console.log(`Created ${role} ${name} <${email}> in ${host}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
