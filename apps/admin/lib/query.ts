// Builds API query strings from page searchParams, keeping only known, non-empty keys.
export type SearchParams = Record<string, string | string[] | undefined>;

export function toQuery(params: SearchParams, keys: readonly string[]): string {
  const q = new URLSearchParams();
  for (const k of keys) {
    const v = params[k];
    const value = Array.isArray(v) ? v[0] : v;
    if (value) q.set(k, value);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
