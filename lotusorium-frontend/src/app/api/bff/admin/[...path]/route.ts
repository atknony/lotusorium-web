import { proxyAdminRequest } from "@/lib/api/bff-server";

/**
 * Generic authed passthrough for the entire admin API surface. Any same-origin
 * `/api/bff/admin/<rest>` call is forwarded to the NestJS `/admin/<rest>` with
 * the Bearer token attached and transparent refresh-retry (see bff-server).
 * The browser thus never sees a token, a CORS preflight, or the API origin.
 */
type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: Request, { params }: Ctx) {
  const { path } = await params;
  return proxyAdminRequest(request, `/admin/${path.join("/")}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
