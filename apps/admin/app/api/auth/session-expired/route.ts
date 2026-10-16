import { revokeAndClear } from "@/lib/revoke";

// Server components redirect here when the API rejects the session (they cannot
// change cookies themselves). Clearing the cookies avoids a /login <-> / loop.
export async function GET(req: Request) {
  return revokeAndClear(new URL("/login?reason=expired", req.url));
}
