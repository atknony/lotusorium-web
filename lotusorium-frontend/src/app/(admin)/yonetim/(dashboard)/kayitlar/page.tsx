import type { Metadata } from "next";
import { getAdminClaims } from "@/lib/auth/claims";
import { AccessDenied } from "@/components/admin/ui";
import { AuditLogView } from "@/components/admin/audit/audit-log-view";

export const metadata: Metadata = { title: "Denetim Kayıtları" };

export default async function AuditPage() {
  const claims = await getAdminClaims();
  if (claims?.role !== "super_admin") return <AccessDenied />;
  return <AuditLogView />;
}
