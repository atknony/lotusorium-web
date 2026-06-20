"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "../ui";
import { adminKeys, deleteCategory, getCategories } from "@/lib/api/admin";
import type { AdminCategory } from "@/lib/api/types";

export function CategoryList() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.categories });
      setDeleteTarget(null);
      toast.success("Kategori silindi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  const nameById = new Map((data ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Kategoriler" description="Ürün kategorilerini yönetin.">
        <Link href="/yonetim/kategoriler/yeni" className={buttonVariants()}>
          <Plus className="size-4" aria-hidden />
          Yeni Kategori
        </Link>
      </PageHeader>

      {isLoading && <LoadingBlock />}
      {isError && (
        <ErrorBlock message={error instanceof Error ? error.message : undefined} />
      )}

      {data && data.length === 0 && (
        <EmptyState
          title="Henüz kategori yok"
          description="İlk kategorinizi oluşturarak başlayın."
        >
          <Link href="/yonetim/kategoriler/yeni" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            Yeni Kategori
          </Link>
        </EmptyState>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <Link
                href={`/yonetim/kategoriler/${c.id}`}
                className="min-w-0 flex-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  {!c.isActive && <Badge tone="archived">Pasif</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5">{c.slug}</code>
                  {c.parentId && nameById.has(c.parentId) && (
                    <span>↳ {nameById.get(c.parentId)}</span>
                  )}
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/yonetim/kategoriler/${c.id}`}
                  aria-label="Düzenle"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  aria-label="Sil"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Kategoriyi sil"
        description={`"${deleteTarget?.name}" silinecek. Bağlı ürünler etkilenebilir.`}
        confirmLabel="Sil"
        pending={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
