import { NextResponse } from "next/server";
import { type AdminLoginResponse, AdminLoginSchema } from "@kisa/shared";
import { apiUrl } from "@/lib/api-url";
import { isSameOrigin } from "@/lib/same-origin";
import { setSessionCookies } from "@/lib/session";

const message = (status: number, text: string) => NextResponse.json({ message: text }, { status });

/** Signs in through the API and stores the tokens in httpOnly cookies. Returns only the profile. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return message(403, "Forbidden");

  const parsed = AdminLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return message(400, "Enter a valid email and password.");

  let res: Response;
  try {
    res = await fetch(apiUrl("/auth/admin/login"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return message(503, "Can't reach the Kisa server right now. Please try again in a moment.");
  }

  if (res.status === 429) return message(429, "Too many sign-in attempts. Please wait a minute and try again.");
  const body = (await res.json().catch(() => ({}))) as Partial<AdminLoginResponse> & { message?: string };
  if (res.status === 401) return message(401, body.message ?? "Invalid email or password");
  if (!res.ok || !body.accessToken || !body.refreshToken || !body.admin) {
    return message(502, "Sign-in failed. Please try again.");
  }

  const out = NextResponse.json({ admin: body.admin });
  setSessionCookies(out.cookies, body as AdminLoginResponse);
  return out;
}
