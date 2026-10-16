// Session cookies for the admin (backend-for-frontend). The browser only ever holds
// httpOnly cookies; tokens are read and sent to the API by the admin's own server.
// Edge-safe: used by middleware as well as route handlers.
import type { AuthTokens } from "@kisa/shared";

export const ACCESS_COOKIE = "kisa_admin_at";
export const REFRESH_COOKIE = "kisa_admin_rt";

interface CookieWriter {
  set(name: string, value: string, options: Record<string, unknown>): unknown;
}

const options = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export function setSessionCookies(cookies: CookieWriter, tokens: AuthTokens) {
  cookies.set(ACCESS_COOKIE, tokens.accessToken, options(tokens.expiresIn));
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, options(tokens.refreshExpiresIn));
}

export function clearSessionCookies(cookies: CookieWriter) {
  cookies.set(ACCESS_COOKIE, "", options(0));
  cookies.set(REFRESH_COOKIE, "", options(0));
}

/**
 * True while the access token has more than a safety margin left: 30 seconds, or half
 * its lifetime for short-lived tokens. The margin must outlast a page render (several
 * API calls), because a page that gets a 401 can't save refreshed cookies and has to
 * end the session. Only decodes the token to read its expiry; the API verifies it.
 */
export function isAccessTokenFresh(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = Number(payload.exp) * 1000;
    const iat = Number(payload.iat) * 1000;
    const margin = Math.min(30_000, (exp - iat) / 2);
    return Number.isFinite(exp) && exp - margin > Date.now();
  } catch {
    return false;
  }
}
