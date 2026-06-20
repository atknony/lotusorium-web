"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select, CheckboxField } from "../form-fields";
import { DynamicAttributes, type AttributeValues } from "./dynamic-attributes";
import {
  adminKeys,
  createProduct,
  getCategory,
  updateProduct,
} from "@/lib/api/admin";
import type {
  AdminCategory,
  AdminProduct,
  ProductWritePayload,
} from "@/lib/api/types";

const schema = z.object({
  categoryId: z.string().uuid("Kategori seçin"),
  name: z.string().trim().min(1, "Ad gerekli").max(200),
  slug: z.string().trim().max(220).optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  status: z.enum(["draft", "published", "archived"]),
  trendyolUrl: z.string().trim().url("Geçerli bir URL girin").or(z.literal("")).optional(),
  fulfillmentChannel: z.enum(["trendyol", "onsite"]),
  priceAmount: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Geçerli bir tutar girin"),
  priceCurrency: z.string().trim().length(3).or(z.literal("")).optional(),
  isFeatured: z.boolean(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyToNull = (s?: string) => {
  const t = s?.trim();
  return t ? t : null;
};

export function ProductForm({
  product,
  categories,
}: {
  product?: AdminProduct;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = Boolean(product);

  const [attributes, setAttributes] = useState<AttributeValues>(
    product?.attributes ?? {},
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: product?.categoryId ?? "",
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      brand: product?.brand ?? "",
      sku: product?.sku ?? "",
      status: product?.status ?? "draft",
      trendyolUrl: product?.trendyolUrl ?? "",
      fulfillmentChannel: product?.fulfillmentChannel ?? "trendyol",
      priceAmount: product?.priceAmount ?? "",
      priceCurrency: product?.priceCurrency ?? "TRY",
      isFeatured: product?.isFeatured ?? false,
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
    },
  });

  const categoryId = watch("categoryId");

  // Load the selected category's attribute definitions to drive the dynamic form.
  const { data: categoryDetail } = useQuery({
    queryKey: adminKeys.category(categoryId),
    queryFn: () => getCategory(categoryId),
    enabled: Boolean(categoryId),
  });
  const definitions = categoryDetail?.attributes ?? [];

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      // Only persist attribute keys defined on the current category — prevents
      // stale keys (e.g. after switching category) which the API would reject.
      const allowed = new Set(definitions.map((d) => d.key));
      const cleanAttributes: AttributeValues = {};
      for (const [k, v] of Object.entries(attributes)) {
        if (allowed.has(k)) cleanAttributes[k] = v;
      }

      const payload: ProductWritePayload = {
        categoryId: values.categoryId,
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        shortDescription: emptyToNull(values.shortDescription),
        description: emptyToNull(values.description),
        brand: values.brand?.trim() || undefined,
        sku: emptyToNull(values.sku),
        status: values.status,
        attributes: cleanAttributes,
        trendyolUrl: emptyToNull(values.trendyolUrl),
        fulfillmentChannel: values.fulfillmentChannel,
        isFeatured: values.isFeatured,
        priceAmount: values.priceAmount ? Number(values.priceAmount) : null,
        priceCurrency: values.priceCurrency?.trim() || null,
        metaTitle: emptyToNull(values.metaTitle),
        metaDescription: emptyToNull(values.metaDescription),
      };
      return isEdit
        ? updateProduct(product!.id, payload)
        : createProduct(payload);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      if (isEdit) qc.invalidateQueries({ queryKey: adminKeys.product(saved.id) });
      toast.success(isEdit ? "Ürün güncellendi" : "Ürün oluşturuldu");
      router.push(`/yonetim/urunler/${saved.id}`);
      router.refresh();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Kaydedilemedi"),
  });

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="max-w-2xl space-y-6"
    >
      <section className="space-y-5">
        <Field label="Kategori" required error={errors.categoryId?.message}>
          <Select {...register("categoryId")}>
            <option value="">— Kategori seçin —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Ad" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" {...register("name")} placeholder="Lavanta Soya Mumu" />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          hint="Boş bırakılırsa addan otomatik oluşturulur."
        >
          <Input id="slug" {...register("slug")} />
        </Field>

        <Field label="Kısa Açıklama" htmlFor="shortDescription">
          <Textarea id="shortDescription" {...register("shortDescription")} className="min-h-16" />
        </Field>

        <Field label="Açıklama" htmlFor="description">
          <Textarea id="description" {...register("description")} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Marka" htmlFor="brand" hint="Boşsa “Lotusorium”.">
            <Input id="brand" {...register("brand")} />
          </Field>
          <Field label="SKU" htmlFor="sku">
            <Input id="sku" {...register("sku")} />
          </Field>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label="Durum" error={errors.status?.message}>
          <Select {...register("status")}>
            <option value="draft">Taslak</option>
            <option value="published">Yayında</option>
            <option value="archived">Arşivlendi</option>
          </Select>
        </Field>
        <Field label="Satış Kanalı">
          <Select {...register("fulfillmentChannel")}>
            <option value="trendyol">Trendyol</option>
            <option value="onsite">Site içi</option>
          </Select>
        </Field>
        <Field label="Fiyat" htmlFor="priceAmount" error={errors.priceAmount?.message}>
          <Input id="priceAmount" inputMode="decimal" {...register("priceAmount")} placeholder="249.90" />
        </Field>
        <Field label="Para Birimi" htmlFor="priceCurrency" error={errors.priceCurrency?.message}>
          <Input id="priceCurrency" maxLength={3} {...register("priceCurrency")} placeholder="TRY" />
        </Field>
      </section>

      <Field label="Trendyol URL" htmlFor="trendyolUrl" error={errors.trendyolUrl?.message}>
        <Input id="trendyolUrl" {...register("trendyolUrl")} placeholder="https://www.trendyol.com/…" />
      </Field>

      <CheckboxField
        label="Öne çıkar"
        hint="Ana sayfada öne çıkan ürünler arasında gösterilir."
        {...register("isFeatured")}
      />

      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-lg font-medium">Özellikler</h2>
        {categoryId ? (
          <DynamicAttributes
            definitions={definitions}
            values={attributes}
            onChange={setAttributes}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Önce bir kategori seçin.
          </p>
        )}
      </section>

      <details className="rounded-lg border border-border bg-card/50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">SEO (isteğe bağlı)</summary>
        <div className="mt-4 space-y-4">
          <Field label="Meta Başlık" htmlFor="metaTitle">
            <Input id="metaTitle" {...register("metaTitle")} />
          </Field>
          <Field label="Meta Açıklama" htmlFor="metaDescription">
            <Textarea id="metaDescription" {...register("metaDescription")} />
          </Field>
        </div>
      </details>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isEdit ? "Değişiklikleri Kaydet" : "Ürün Oluştur"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/yonetim/urunler")}>
          İptal
        </Button>
      </div>
    </form>
  );
}
