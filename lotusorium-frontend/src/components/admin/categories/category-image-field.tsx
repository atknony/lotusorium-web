"use client";

import { useRef, useState } from "react";
import { ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "../form-fields";
import { BffError } from "@/lib/api/bff-client";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";

/**
 * Category cover image picker — signed direct Cloudinary upload (same flow as
 * the product gallery), but a category holds a single `imageUrl` string rather
 * than an image sub-resource, so this is a controlled field: it uploads, then
 * reports the resulting secure URL up to the form. Degrades to a manual URL
 * input only if the API's media signing is dormant (503).
 */
export function CategoryImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cloudUnavailable, setCloudUnavailable] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, "lotusorium/categories");
      onChange(result.secure_url);
      toast.success("Görsel yüklendi");
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

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium">Kapak Görseli</span>

      <div className="flex items-start gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Kategori kapak önizleme"
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
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
              {value ? "Görseli Değiştir" : "Görsel Yükle"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
              >
                <Trash2 className="size-4" aria-hidden />
                Kaldır
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cihazınızdan bir görsel seçin. JPG, PNG veya WebP.
          </p>
        </div>
      </div>

      {cloudUnavailable && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Görsel yükleme için Cloudinary yapılandırması gerekir
            (<code className="text-xs">CLOUDINARY_*</code> ortam değişkenleri).
            Bunun yerine bir görsel URL&apos;si girebilirsiniz.
          </p>
          <Input
            value={value}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
