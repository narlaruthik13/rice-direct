// Protects every page except /login, and keeps the session alive: when the access
// token is expired (or about to be), it refreshes once (single-flight), passes the
// new token to this request's server components and saves both cookies.
import { NextResponse, type NextRequest } from "next/server";
import type { AuthTokens } from "@kisa/shared";
import { refreshTokens } from "@/lib/refresh";
import { ACCESS_COOKIE, clearSessionCookies, isAccessTokenFresh, REFRESH_COOKIE, setSessionCookies } from "@/lib/session";

export const config = {
  // Everything except static files and the auth route handlers (they manage cookies themselves).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/auth/).*)"],
};

/** Only same-site relative paths, so ?next= cannot send the admin to another site. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") ? value : "/";
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const onLogin = pathname === "/login";
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  let signedIn = isAccessTokenFresh(access);
  let renewed: AuthTokens | null = null;

  if (!signedIn && refresh) {
    const result = await refreshTokens(refresh);
    if (result.ok) {
      signedIn = true;
      renewed = result.tokens;
    } else if (result.reason === "unavailable") {
      // Keep the cookies: the session may still be valid once the API is back.
      if (onLogin) return NextResponse.next();
      return NextResponse.redirect(new URL("/login?error=unavailable", req.url));
    }
  }

  if (onLogin) {
    if (signedIn) {
      const res = NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url));
      if (renewed) setSessionCookies(res.cookies, renewed);
      return res;
    }
    const res = NextResponse.next();
    if (access || refresh) clearSessionCookies(res.cookies); // stale cookies
    return res;
  }

  if (!signedIn) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    const res = NextResponse.redirect(url);
    if (access || refresh) clearSessionCookies(res.cookies);
    return res;
  }

  if (!renewed) return NextResponse.next();

  // Server components of this same request read the new access token...
  req.cookies.set(ACCESS_COOKIE, renewed.accessToken);
  req.cookies.set(REFRESH_COOKIE, renewed.refreshToken);
  const res = NextResponse.next({ request: { headers: req.headers } });
  // ...and the browser stores both for the next requests.
  setSessionCookies(res.cookies, renewed);
  return res;
}
