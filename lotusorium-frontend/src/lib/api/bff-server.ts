import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  extractRefreshToken,
  isAccessTokenExpired,
  setSessionCookies,
} from "@/lib/auth/session";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api/v1";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Exchanges the stored refresh token for a fresh access/refresh pair via the
 * API's `/auth/refresh`, persisting the rotated cookies. Returns the new access
 * token, or null when the refresh is invalid/expired (session is cleared).
 */
async function refreshSession(store: CookieStore): Promise<string | null> {
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refresh_token=${refresh}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    clearSessionCookies(store);
    return null;
  }

  const data = (await res.json().catch(() => null)) as {
    accessToken?: string;
  } | null;
  const rotatedRefresh = extractRefreshToken(res) ?? refresh;
  if (!data?.accessToken) {
    clearSessionCookies(store);
    return null;
  }

  setSessionCookies(store, data.accessToken, rotatedRefresh);
  return data.accessToken;
}

/**
 * Returns a usable access token, refreshing first when the current one is
 * missing or (about to be) expired. Null means the caller should 401.
 */
export async function getValidAccessToken(
  store: CookieStore,
): Promise<string | null> {
  const current = store.get(ACCESS_COOKIE)?.value;
  if (!isAccessTokenExpired(current)) return current ?? null;
  return refreshSession(store);
}

export interface ApiCallResult {
  status: number;
  body: unknown;
}

/**
 * Server-side authed call to the NestJS API for use inside Route Handlers /
 * Server Components that can write cookies. Attaches the Bearer token and, on a
 * 401 (e.g. the token was revoked before its clock expiry), transparently
 * refreshes once and retries. On terminal auth failure the session is cleared.
 */
export async function apiAdmin(
  store: CookieStore,
  path: string,
  init: {
    method?: string;
    body?: string | null;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiCallResult> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const run = async (token: string): Promise<Response> => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    };
    if (init.body != null && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, {
      method: init.method ?? "GET",
      headers,
      body: init.body ?? undefined,
      cache: "no-store",
    });
  };

  let token = await getValidAccessToken(store);
  if (!token) return { status: 401, body: { error: "Unauthorized" } };

  let res = await run(token);

  // Token rejected despite passing the clock check → refresh once and retry.
  if (res.status === 401) {
    token = await refreshSession(store);
    if (!token) return { status: 401, body: { error: "Unauthorized" } };
    res = await run(token);
  }

  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

/**
 * Forwards an incoming same-origin admin request to the API's `/admin/*`
 * surface, preserving method, query string, and body, with the auth dance
 * above. Returns a NextResponse mirroring the API's status + JSON body.
 */
export async function proxyAdminRequest(
  request: Request,
  apiPath: string,
): Promise<NextResponse> {
  const store = await cookies();
  const search = new URL(request.url).search;

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD" && method !== "DELETE";
  const body = hasBody ? await request.text() : null;

  const { status, body: data } = await apiAdmin(store, `${apiPath}${search}`, {
    method,
    body: body && body.length > 0 ? body : null,
  });

  return NextResponse.json(data ?? null, { status });
}

export { refreshSession };
