"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ImageOff, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "../form-fields";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "../ui";
import { adminKeys, getFeatured, getProducts, setFeatured } from "@/lib/api/admin";
import type { AdminProduct } from "@/lib/api/types";

function Thumb({ product }: { product: AdminProduct }) {
  const img = product.images.find((i) => i.isPrimary) ?? product.images[0];
  if (!img) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <ImageOff className="size-4" aria-hidden />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={img.url}
      alt={img.altText ?? product.name}
      className="size-12 shrink-0 rounded-lg object-cover"
    />
  );
}

export function FeaturedManager() {
  const qc = useQueryClient();

  const featuredQuery = useQuery({
    queryKey: adminKeys.featured,
    queryFn: getFeatured,
  });
  const allProductsQuery = useQuery({
    queryKey: adminKeys.products({}),
    queryFn: () => getProducts({}),
  });

  const [order, setOrder] = useState<AdminProduct[]>([]);
  const [dirty, setDirty] = useState(false);
  const [addId, setAddId] = useState("");

  // Seed local order from the server once loaded (and after a successful save).
  useEffect(() => {
    if (featuredQuery.data) {
      setOrder(featuredQuery.data);
      setDirty(false);
    }
  }, [featuredQuery.data]);

  const saveMut = useMutation({
    mutationFn: () => setFeatured(order.map((p) => p.id)),
    onSuccess: (saved) => {
      qc.setQueryData(adminKeys.featured, saved);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setDirty(false);
      toast.success("Öne çıkanlar kaydedildi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kaydedilemedi"),
  });

  if (featuredQuery.isLoading) return <LoadingBlock />;
  if (featuredQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorBlock message="Öne çıkanlar yüklenemedi." />
      </div>
    );
  }

  const featuredIds = new Set(order.map((p) => p.id));
  const candidates = (allProductsQuery.data ?? []).filter((p) => !featuredIds.has(p.id));

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  function remove(id: string) {
    setOrder(order.filter((p) => p.id !== id));
    setDirty(true);
  }

  function add() {
    const product = candidates.find((p) => p.id === addId);
    if (!product) return;
    setOrder([...order, product]);
    setAddId("");
    setDirty(true);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Öne Çıkanlar"
        description="Ana sayfada gösterilecek ürünleri ve sıralarını belirleyin."
      >
        <Button type="button" onClick={() => saveMut.mutate()} disabled={!dirty || saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Kaydet
        </Button>
      </PageHeader>

      <div className="mb-5 flex gap-2">
        <Select value={addId} onChange={(e) => setAddId(e.target.value)} className="flex-1">
          <option value="">— Öne çıkana ürün ekle —</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Button type="button" variant="outline" onClick={add} disabled={!addId}>
          <Plus className="size-4" aria-hidden />
          Ekle
        </Button>
      </div>

      {order.length === 0 ? (
        <EmptyState
          title="Öne çıkan ürün yok"
          description="Yukarıdan ürün ekleyerek ana sayfa vitrinini oluşturun."
        />
      ) : (
        <ul className="space-y-2">
          {order.map((p, index) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="w-5 text-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <Thumb product={p} />
              <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Yukarı taşı"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Aşağı taşı"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Kaldır"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {dirty && (
        <p className="mt-4 text-xs text-muted-foreground">
          Kaydedilmemiş değişiklikler var.
        </p>
      )}
    </div>
  );
}
