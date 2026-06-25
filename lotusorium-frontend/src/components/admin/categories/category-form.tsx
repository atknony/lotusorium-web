"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Select, CheckboxField } from "../form-fields";
import { CategoryImageField } from "./category-image-field";
import { adminKeys, createCategory, updateCategory } from "@/lib/api/admin";
import type {
  AdminCategory,
  AdminCategoryDetail,
  CategoryWritePayload,
} from "@/lib/api/types";

const schema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().optional(),
  parentId: z.string().optional(),
  imageUrl: z.string().trim().url("Geçerli bir URL girin").or(z.literal("")).optional(),
  sortOrder: z.string().trim().optional(),
  isActive: z.boolean(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyToNull = (s?: string) => {
  const t = s?.trim();
  return t ? t : null;
};

export function CategoryForm({
  category,
  categories,
}: {
  category?: AdminCategoryDetail;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const isEdit = Boolean(category);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      parentId: category?.parentId ?? "",
      imageUrl: category?.imageUrl ?? "",
      sortOrder: String(category?.sortOrder ?? 0),
      isActive: category?.isActive ?? true,
      metaTitle: category?.metaTitle ?? "",
      metaDescription: category?.metaDescription ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CategoryWritePayload = {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        description: emptyToNull(values.description),
        parentId: values.parentId ? values.parentId : null,
        imageUrl: emptyToNull(values.imageUrl),
        sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
        isActive: values.isActive,
        metaTitle: emptyToNull(values.metaTitle),
        metaDescription: emptyToNull(values.metaDescription),
      };
      return isEdit
        ? updateCategory(category!.id, payload)
        : createCategory(payload);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: adminKeys.categories });
      if (isEdit) qc.invalidateQueries({ queryKey: adminKeys.category(saved.id) });
      toast.success(isEdit ? "Kategori güncellendi" : "Kategori oluşturuldu");
      router.push(`/yonetim/kategoriler/${saved.id}`);
      router.refresh();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Kaydedilemedi"),
  });

  const imageUrl = useWatch({ control, name: "imageUrl" }) ?? "";

  // A category cannot be its own parent.
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="max-w-2xl space-y-5"
    >
      <Field label="Ad" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" {...register("name")} placeholder="Mumlar" />
      </Field>

      <Field
        label="Slug"
        htmlFor="slug"
        hint="Boş bırakılırsa addan otomatik oluşturulur."
        error={errors.slug?.message}
      >
        <Input id="slug" {...register("slug")} placeholder="mumlar" />
      </Field>

      <Field label="Açıklama" htmlFor="description">
        <Textarea id="description" {...register("description")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Üst Kategori" htmlFor="parentId">
          <Select id="parentId" {...register("parentId")}>
            <option value="">— Yok (ana kategori) —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Sıralama" htmlFor="sortOrder" hint="Küçük değer önce gösterilir.">
          <Input id="sortOrder" type="number" {...register("sortOrder")} />
        </Field>
      </div>

      <CategoryImageField
        value={imageUrl}
        onChange={(url) =>
          setValue("imageUrl", url, { shouldDirty: true, shouldValidate: true })
        }
      />
      {errors.imageUrl?.message && (
        <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
      )}

      <CheckboxField
        label="Aktif"
        hint="Pasif kategoriler mağazada görünmez."
        {...register("isActive")}
      />

      <details className="rounded-lg border border-border bg-card/50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">
          SEO (isteğe bağlı)
        </summary>
        <div className="mt-4 space-y-4">
          <Field label="Meta Başlık" htmlFor="metaTitle">
            <Input id="metaTitle" {...register("metaTitle")} />
          </Field>
          <Field label="Meta Açıklama" htmlFor="metaDescription">
            <Textarea id="metaDescription" {...register("metaDescription")} />
          </Field>
        </div>
      </details>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isEdit ? "Değişiklikleri Kaydet" : "Kategori Oluştur"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/yonetim/kategoriler")}
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
