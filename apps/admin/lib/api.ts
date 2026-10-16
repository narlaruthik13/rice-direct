import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "./api-url";
import { refreshTokens } from "./refresh";
import { ACCESS_COOKIE, REFRESH_COOKIE, setSessionCookies } from "./session";

export interface ApiIssue {
  path: string;
  message: string;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues?: ApiIssue[],
  ) {
    super(message);
  }
}

/** Ends the session and returns to /login (clears cookies in a route handler). */
const SESSION_EXPIRED = "/api/auth/session-expired";

/**
 * Cookies can only be written in route handlers and server actions. Middleware
 * refreshes tokens before pages render, so a page should rarely see a 401; if it
 * does, it must not rotate the refresh token without being able to save the new one.
 */
function canWriteCookies(): boolean {
  try {
    cookies().set("kisa_admin_probe", "", { maxAge: 0, path: "/" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Calls the API from the admin's server with the signed-in admin's access token.
 * On a 401 it refreshes once (single-flight) and retries; if that fails, the
 * session has ended and the admin is sent to /login.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = cookies();
  const send = (token: string | undefined) =>
    fetch(apiUrl(path), {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

  let res = await send(jar.get(ACCESS_COOKIE)?.value);

  if (res.status === 401) {
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;
    if (!refreshToken || !canWriteCookies()) redirect(SESSION_EXPIRED);
    const result = await refreshTokens(refreshToken);
    if (!result.ok) redirect(result.reason === "unavailable" ? "/login?error=unavailable" : SESSION_EXPIRED);
    setSessionCookies(jar, result.tokens);
    res = await send(result.tokens.accessToken);
    if (res.status === 401) redirect(SESSION_EXPIRED);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; issues?: ApiIssue[] };
    throw new ApiRequestError(res.status, body.message ?? `Request failed (${res.status})`, body.issues);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
