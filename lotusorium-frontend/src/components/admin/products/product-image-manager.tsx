"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ImageOff,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "../form-fields";
import { ConfirmDialog } from "../ui";
import { BffError } from "@/lib/api/bff-client";
import {
  addProductImage,
  adminKeys,
  deleteProductImage,
  getProductImages,
  reorderProductImages,
  signUpload,
  updateProductImage,
} from "@/lib/api/admin";
import type { AdminProductImage } from "@/lib/api/types";

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
}

async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const sig = await signUpload();
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) throw new Error("Cloudinary yüklemesi başarısız oldu");
  return res.json() as Promise<CloudinaryUploadResult>;
}

export function ProductImageManager({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cloudUnavailable, setCloudUnavailable] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminProductImage | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: adminKeys.productImages(productId),
    queryFn: () => getProductImages(productId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: adminKeys.productImages(productId) });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { altText?: string; isPrimary?: boolean } }) =>
      updateProductImage(productId, id, payload),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Güncellenemedi"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProductImage(productId, id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Görsel silindi");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  const reorderMut = useMutation({
    mutationFn: (orderedIds: string[]) => reorderProductImages(productId, orderedIds),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Sıralanamadı"),
  });

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadToCloudinary(files[i]);
        await addProductImage(productId, {
          cloudinaryPublicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          isPrimary: images.length === 0 && i === 0,
        });
      }
      invalidate();
      toast.success("Görsel(ler) yüklendi");
    } catch (e) {
      // The API's media signing is dormant (503) until CLOUDINARY_* is set.
      if (e instanceof BffError && e.status === 503) {
        setCloudUnavailable(true);
        toast.error("Görsel yükleme yapılandırılmamış (Cloudinary)");
      } else {
        toast.error(e instanceof Error ? e.message : "Yükleme başarısız oldu");
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMut.mutate(next.map((img) => img.id));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Görseller</h2>
          <p className="text-sm text-muted-foreground">
            İlk görsel kapak olarak kullanılır. Sürükleyerek değil, oklarla sıralayın.
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || cloudUnavailable}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
          Görsel Yükle
        </Button>
      </div>

      {cloudUnavailable && (
        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Görsel yükleme için Cloudinary yapılandırması gerekir
          (<code className="text-xs">CLOUDINARY_*</code> ortam değişkenleri). Mevcut
          görseller yönetilebilir.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
        </div>
      ) : images.length === 0 ? (
        <p className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-sm text-muted-foreground">
          <ImageOff className="size-4" aria-hidden />
          Henüz görsel yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {images.map((img, index) => (
            <li
              key={img.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? ""}
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {img.isPrimary ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-clay">
                      <Star className="size-3.5 fill-clay" aria-hidden /> Kapak
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateMut.mutate({ id: img.id, payload: { isPrimary: true } })}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Kapak yap
                    </button>
                  )}
                </div>
                <Input
                  defaultValue={img.altText ?? ""}
                  placeholder="Alternatif metin (erişilebilirlik / SEO)"
                  className="h-9 py-1.5 text-xs"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (img.altText ?? "")) {
                      updateMut.mutate({ id: img.id, payload: { altText: v } });
                    }
                  }}
                />
              </div>
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Yukarı taşı"
                  disabled={index === 0 || reorderMut.isPending}
                  onClick={() => move(index, -1)}
                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Aşağı taşı"
                  disabled={index === images.length - 1 || reorderMut.isPending}
                  onClick={() => move(index, 1)}
                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(img)}
                aria-label="Sil"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Görseli sil"
        description="Bu görsel hem üründen hem de Cloudinary'den kaldırılacak."
        confirmLabel="Sil"
        pending={deleteMut.isPending}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
