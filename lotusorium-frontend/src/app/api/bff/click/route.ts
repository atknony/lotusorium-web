import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:3000/api/v1";

/**
 * BFF proxy for the Trendyol redirect click. The browser POSTs here (same
 * origin — no CORS); we forward to the NestJS API server-side, preserving the
 * client UA/referer/IP so the API's analytics + rate-limit stay meaningful,
 * and return the resolved trendyolUrl.
 */
export async function POST(request: Request) {
  let body: { productId?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { productId, sessionId } = body;
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const ua = request.headers.get("user-agent");
  const referer = request.headers.get("referer");
  const xff =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (ua) headers["user-agent"] = ua;
  if (referer) headers["referer"] = referer;
  if (xff) headers["x-forwarded-for"] = xff;

  try {
    const res = await fetch(
      `${API_BASE_URL}/products/${encodeURIComponent(productId)}/click`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(sessionId ? { sessionId } : {}),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "click_failed" },
        { status: res.status },
      );
    }

    const data = (await res.json()) as { trendyolUrl: string | null };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }
}
