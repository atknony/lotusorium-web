"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatTRY } from "@/lib/utils";
import {
  Badge,
  ConfirmDialog,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "../ui";
import { Input, Select } from "../form-fields";
import {
  adminKeys,
  deleteProduct,
  getCategories,
  getProducts,
  type ProductFilters,
} from "@/lib/api/admin";
import type { AdminProduct, ProductStatus } from "@/lib/api/types";

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Taslak",
  published: "Yayında",
  archived: "Arşiv",
};

function Thumb({ product }: { product: AdminProduct }) {
  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
  if (!img) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <ImageOff className="size-5" aria-hidden />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={img.url}
      alt={img.altText ?? product.name}
      className="size-14 shrink-0 rounded-lg object-cover"
    />
  );
}

export function ProductList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);

  const filters: ProductFilters = {
    search: search.trim() || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: adminKeys.products(filters),
    queryFn: () => getProducts(filters),
  });

  const { data: categories } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setDeleteTarget(null);
      toast.success("Ürün silindi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Ürünler" description="Ürün kataloğunu yönetin.">
        <Link href="/yonetim/urunler/yeni" className={buttonVariants()}>
          <Plus className="size-4" aria-hidden />
          Yeni Ürün
        </Link>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="Ürün ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus | "")}>
          <option value="">Tüm durumlar</option>
          <option value="draft">Taslak</option>
          <option value="published">Yayında</option>
          <option value="archived">Arşiv</option>
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Tüm kategoriler</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingBlock />}
      {isError && <ErrorBlock message={error instanceof Error ? error.message : undefined} />}

      {data && data.length === 0 && (
        <EmptyState
          title="Ürün bulunamadı"
          description="Filtreleri değiştirin veya yeni bir ürün ekleyin."
        >
          <Link href="/yonetim/urunler/yeni" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            Yeni Ürün
          </Link>
        </EmptyState>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Link href={`/yonetim/urunler/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Thumb product={p} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.isFeatured && (
                      <Star className="size-3.5 fill-clay text-clay" aria-label="Öne çıkan" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge tone={p.status}>{STATUS_LABEL[p.status]}</Badge>
                    {p.priceAmount != null && (
                      <span>{formatTRY(Number(p.priceAmount), p.priceCurrency ?? "TRY")}</span>
                    )}
                    {p.category && <span>· {p.category.name}</span>}
                  </div>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/yonetim/urunler/${p.id}`}
                  aria-label="Düzenle"
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Pencil className="size-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(p)}
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
        title="Ürünü sil"
        description={`"${deleteTarget?.name}" arşive taşınacak (yumuşak silme). Geri alınabilir.`}
        confirmLabel="Sil"
        pending={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
