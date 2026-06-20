"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "../ui";
import { adminKeys, deleteUser, getUsers } from "@/lib/api/admin";
import type { AdminRole, AdminUser } from "@/lib/api/types";
import { UserFormDialog } from "./user-form-dialog";

const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "Süper Yönetici",
  editor: "Editör",
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** `currentUserId` comes from the server (decoded token) to block self-delete. */
export function UserList({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; user?: AdminUser } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.users,
    queryFn: getUsers,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users });
      setDeleteTarget(null);
      toast.success("Kullanıcı silindi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Kullanıcılar" description="Yönetici hesaplarını yönetin.">
        <Button type="button" onClick={() => setDialog({ mode: "create" })}>
          <Plus className="size-4" aria-hidden />
          Yeni Kullanıcı
        </Button>
      </PageHeader>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock message={error instanceof Error ? error.message : undefined} />}

      {data && data.length === 0 && <EmptyState title="Kullanıcı yok" />}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u.name ?? u.email}</span>
                    <Badge tone={u.role === "super_admin" ? "published" : "neutral"}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                    {!u.isActive && <Badge tone="archived">Pasif</Badge>}
                    {isSelf && <Badge tone="neutral">Siz</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{u.email}</span>
                    {u.lastLoginAt && (
                      <span>· Son giriş {dateFmt.format(new Date(u.lastLoginAt))}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDialog({ mode: "edit", user: u })}
                    aria-label="Düzenle"
                    className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(u)}
                    disabled={isSelf}
                    aria-label="Sil"
                    title={isSelf ? "Kendi hesabınızı silemezsiniz" : "Sil"}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog && (
        <UserFormDialog user={dialog.user} onClose={() => setDialog(null)} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Kullanıcıyı sil"
        description={`"${deleteTarget?.name ?? deleteTarget?.email}" kalıcı olarak silinecek.`}
        confirmLabel="Sil"
        pending={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
