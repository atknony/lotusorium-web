import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/api/bff-server";

/**
 * Explicit refresh endpoint. The generic admin proxy refreshes transparently,
 * but the client can call this proactively (e.g. on app focus) to rotate the
 * session. Returns 401 when the refresh token is invalid/expired.
 */
export async function POST() {
  const store = await cookies();
  const token = await refreshSession(store);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
