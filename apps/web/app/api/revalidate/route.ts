// POST /api/revalidate: the admin's server calls this after a catalogue change, so the
// website shows it at once instead of after the 5-minute safety-net revalidate.
//
//   header  x-revalidate-secret: <REVALIDATE_SECRET>
//   body    { "tags": ["products", "product:<slug>", "trace:<batchId>", ...] }
import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Only tags lib/data.ts uses, with the API's own slug and batch id formats. */
const TAG = /^(?:products|varieties|catalogue|product:[a-z0-9-]{1,80}|trace:[A-Z0-9-]{3,40})$/;
const MAX_TAGS = 50;

/** Constant-time compare (hashing first makes the lengths equal). */
function secretMatches(given: string | null, expected: string): boolean {
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "Revalidation is not configured" }, { status: 503 });
  if (!secretMatches(req.headers.get("x-revalidate-secret"), secret)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = body?.tags;
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > MAX_TAGS || !tags.every((t) => typeof t === "string" && TAG.test(t))) {
    return NextResponse.json({ message: `Send { "tags": [...] } with 1-${MAX_TAGS} known cache tags` }, { status: 400 });
  }

  const unique = Array.from(new Set(tags as string[]));
  for (const tag of unique) revalidateTag(tag);
  return NextResponse.json({ revalidated: unique });
}
