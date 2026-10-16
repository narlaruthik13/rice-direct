import { NextResponse } from "next/server";
import { revokeAndClear } from "@/lib/revoke";
import { isSameOrigin } from "@/lib/same-origin";

// Called by the logout <form method="post"> in the top bar, so it works without JavaScript.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  return revokeAndClear(new URL("/login?reason=signed-out", req.url));
}
