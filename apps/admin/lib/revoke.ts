import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiUrl } from "./api-url";
import { clearSessionCookies, REFRESH_COOKIE } from "./session";

/** Revokes the session at the API (best effort), clears the cookies, then redirects. */
export async function revokeAndClear(redirectTo: URL) {
  const refreshToken = cookies().get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await fetch(apiUrl("/auth/admin/logout"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => undefined); // the cookies are cleared either way
  }
  const res = NextResponse.redirect(redirectTo, 303);
  clearSessionCookies(res.cookies);
  return res;
}
