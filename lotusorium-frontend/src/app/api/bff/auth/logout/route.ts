import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
} from "@/lib/auth/session";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api/v1";

/**
 * BFF logout. Best-effort revokes the refresh token at the API (so the whole
 * token family dies server-side), then always clears our own cookies — the
 * local session ends even if the upstream call fails.
 */
export async function POST() {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (refresh) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
          Cookie: `refresh_token=${refresh}`,
        },
        cache: "no-store",
      });
    } catch {
      // Ignore — we clear the local session regardless.
    }
  }

  clearSessionCookies(store);
  return NextResponse.json({ success: true });
}
