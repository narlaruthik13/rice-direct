// Single-flight token refresh. Edge-safe (used by middleware).
//
// The API rotates refresh tokens and treats a reused one as theft (it ends every
// session). A page load fires several requests at once (the page, RSC payloads,
// prefetches), and each may find the access token expired. So:
//   - concurrent refreshes with the same refresh token share one API call, and
//   - for a minute afterwards, requests that still carry the old refresh token
//     (the browser has not stored the new cookies yet) get the same new tokens.
import type { AuthTokens } from "@kisa/shared";
import { apiUrl } from "./api-url";

export type RefreshResult = { ok: true; tokens: AuthTokens } | { ok: false; reason: "invalid" | "unavailable" };

const RECENT_MS = 60_000;
const inflight = new Map<string, Promise<RefreshResult>>();
const recent = new Map<string, { tokens: AuthTokens; at: number }>();

function prune(now: number) {
  for (const [key, value] of recent) if (now - value.at > RECENT_MS) recent.delete(key);
}

export function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  const now = Date.now();
  prune(now);
  const done = recent.get(refreshToken);
  if (done) return Promise.resolve({ ok: true, tokens: done.tokens });
  const running = inflight.get(refreshToken);
  if (running) return running;

  const call = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(apiUrl("/auth/admin/refresh"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 400) return { ok: false, reason: "invalid" };
      if (!res.ok) return { ok: false, reason: "unavailable" };
      const tokens = (await res.json()) as AuthTokens;
      recent.set(refreshToken, { tokens, at: Date.now() });
      return { ok: true, tokens };
    } catch {
      return { ok: false, reason: "unavailable" };
    } finally {
      inflight.delete(refreshToken);
    }
  })();
  inflight.set(refreshToken, call);
  return call;
}
