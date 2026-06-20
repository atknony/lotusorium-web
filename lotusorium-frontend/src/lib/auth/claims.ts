import "server-only";

import { cookies } from "next/headers";
import { ACCESS_COOKIE, decodeAccessToken } from "./session";
import type { AccessTokenClaims } from "@/lib/api/types";

/**
 * Reads the current admin's claims from the access cookie (decode only — the
 * API re-verifies on every call). Safe in Server Components: it only reads
 * cookies, never writes them. Returns null when there's no decodable token.
 */
export async function getAdminClaims(): Promise<AccessTokenClaims | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  return token ? decodeAccessToken(token) : null;
}
