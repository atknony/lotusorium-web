import type { Metadata } from "next";
import { getAdminClaims } from "@/lib/auth/claims";
import { AccessDenied } from "@/components/admin/ui";
import { UserList } from "@/components/admin/users/user-list";

export const metadata: Metadata = { title: "Kullanıcılar" };

export default async function UsersPage() {
  const claims = await getAdminClaims();
  if (claims?.role !== "super_admin") return <AccessDenied />;
  return <UserList currentUserId={claims.sub} />;
}
