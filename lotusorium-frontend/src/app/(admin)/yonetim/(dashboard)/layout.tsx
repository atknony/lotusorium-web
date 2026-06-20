import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, decodeAccessToken } from "@/lib/auth/session";
import { AdminQueryProvider } from "@/components/admin/query-provider";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Yönetim · Lotusorium" },
  robots: { index: false, follow: false },
};

/**
 * Guarded admin shell. `proxy.ts` already bounces sessionless visitors to the
 * login page; here we decode the (non-verified) access token only to drive nav
 * gating and the identity badge — the API re-verifies on every BFF call. If the
 * token can't be decoded at all, fall back to the login page defensively.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  const claims = token ? decodeAccessToken(token) : null;

  if (!claims) {
    redirect("/yonetim/giris");
  }

  return (
    <AdminQueryProvider>
      <AdminShell user={{ email: claims.email, role: claims.role }}>
        {children}
      </AdminShell>
    </AdminQueryProvider>
  );
}
