import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REFRESH_COOKIE = "lts_rt";
const LOGIN_PATH = "/yonetim/giris";

/**
 * Guards the admin area. This is a coarse presence check on the (durable,
 * httpOnly) refresh cookie — real authorization is enforced by the API on every
 * BFF call; here we only keep unauthenticated visitors out of the dashboard
 * shell and bounce already-authenticated ones away from the login page.
 *
 * Next.js 16 renamed `middleware` → `proxy` (Node.js runtime).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(REFRESH_COOKIE);
  const isLoginPage = pathname === LOGIN_PATH;

  if (isLoginPage) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/yonetim", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/yonetim/:path*",
};
