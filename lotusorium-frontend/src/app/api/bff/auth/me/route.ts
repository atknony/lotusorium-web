import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiAdmin } from "@/lib/api/bff-server";

/** Returns the current admin user (or 401), refreshing the token if needed. */
export async function GET() {
  const store = await cookies();
  const { status, body } = await apiAdmin(store, "/auth/me");
  if (status !== 200) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(body, { status: 200 });
}
