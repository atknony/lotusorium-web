import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extractRefreshToken, setSessionCookies } from "@/lib/auth/session";
import type { AuthSessionResponse } from "@/lib/api/types";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api/v1";

/**
 * BFF login. Forwards credentials to the API, then consumes both the
 * `accessToken` (JSON) and the API's `refresh_token` (Set-Cookie) server-side,
 * re-issuing them as our own httpOnly cookies. Only the public user object is
 * returned to the browser — never a token.
 */
export async function POST(request: Request) {
  let credentials: { email?: string; password?: string };
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  if (!credentials.email || !credentials.password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gerekli" },
      { status: 400 },
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Sunucuya ulaşılamadı" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    // Don't leak which emails exist — surface a single generic message on 401.
    const message =
      res.status === 401
        ? "E-posta veya şifre hatalı"
        : "Giriş başarısız oldu";
    return NextResponse.json({ error: message }, { status: res.status });
  }

  const data = (await res.json().catch(() => null)) as AuthSessionResponse | null;
  const refresh = extractRefreshToken(res);
  if (!data?.accessToken || !refresh) {
    return NextResponse.json(
      { error: "Oturum oluşturulamadı" },
      { status: 502 },
    );
  }

  const store = await cookies();
  setSessionCookies(store, data.accessToken, refresh);

  return NextResponse.json({ user: data.user });
}
