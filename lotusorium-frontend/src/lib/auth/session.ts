import "server-only";

import type { cookies } from "next/headers";
import type { AccessTokenClaims } from "@/lib/api/types";

/**
 * BFF session model.
 *
 * The browser never holds a token. The NestJS API returns an `accessToken` in
 * the JSON body and sets its opaque `refresh_token` via a `Set-Cookie` scoped
 * to `/api/v1/auth` (SameSite=strict) — useless cross-origin from Vercel. So we
 * consume both server-side and re-issue them as two Next-managed httpOnly
 * cookies under our own origin (Path=/, SameSite=Lax). Every admin call is then
 * same-origin: the BFF reads `lts_at`, attaches the Bearer, and replays
 * `lts_rt` to the API as a `refresh_token` cookie only when refreshing.
 */
export const ACCESS_COOKIE = "lts_at";
export const REFRESH_COOKIE = "lts_rt";

/** The API's own refresh cookie name (what it reads on /auth/refresh). */
export const API_REFRESH_COOKIE = "refresh_token";

// Keep the transport cookies long-lived (the JWT's own `exp` governs auth; an
// expired access token simply triggers a transparent refresh). 30 days mirrors
// the API's default refresh TTL.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const isProd = process.env.NODE_ENV === "production";

/** The writable cookie store returned by `cookies()` in a Route Handler. */
type WritableCookies = Awaited<ReturnType<typeof cookies>>;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/** Persists a fresh access + refresh pair as Next-managed httpOnly cookies. */
export function setSessionCookies(
  cookieStore: WritableCookies,
  accessToken: string,
  refreshToken: string,
): void {
  const opts = baseCookieOptions();
  cookieStore.set(ACCESS_COOKIE, accessToken, opts);
  cookieStore.set(REFRESH_COOKIE, refreshToken, opts);
}

/** Clears the session (logout / failed refresh). */
export function clearSessionCookies(cookieStore: WritableCookies): void {
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

/**
 * Pulls the raw `refresh_token` value out of the API's `Set-Cookie` header(s).
 * `getSetCookie()` returns one entry per cookie; we only care about the refresh.
 */
export function extractRefreshToken(res: Response): string | null {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const match = raw.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Decodes (does NOT verify) an access-token JWT payload. The API already signed
 * it; we only read `role`/`email`/`exp` here to drive UI gating. Never trust
 * this for authorization — the API re-verifies on every request.
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

/** True when the token is absent or past (or within 10s of) its `exp`. */
export function isAccessTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  const claims = decodeAccessToken(token);
  if (!claims?.exp) return true;
  return claims.exp * 1000 <= Date.now() + 10_000;
}
