// Base URL of the Kisa API, from the server-only API_URL variable (never NEXT_PUBLIC_).
export function apiUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL is not set (see apps/admin/.env.example)");
  return `${base.replace(/\/+$/, "")}/api/v1${path}`;
}
