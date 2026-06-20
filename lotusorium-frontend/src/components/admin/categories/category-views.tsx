"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorBlock, LoadingBlock, PageHeader } from "../ui";
import { adminKeys, getCategories, getCategory } from "@/lib/api/admin";
import { CategoryForm } from "./category-form";
import { AttributeEditor } from "./attribute-editor";

export function CategoryCreateView() {
  const { data: categories } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Yeni Kategori" backHref="/yonetim/kategoriler" />
      <CategoryForm categories={categories ?? []} />
    </div>
  );
}

export function CategoryEditView({ id }: { id: string }) {
  const categoryQuery = useQuery({
    queryKey: adminKeys.category(id),
    queryFn: () => getCategory(id),
  });
  const { data: categories } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: getCategories,
  });

  if (categoryQuery.isLoading) return <LoadingBlock />;
  if (categoryQuery.isError || !categoryQuery.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorBlock message="Kategori bulunamadı." />
      </div>
    );
  }

  const category = categoryQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <PageHeader
          title={category.name}
          description="Kategori bilgilerini düzenleyin."
          backHref="/yonetim/kategoriler"
        />
        <CategoryForm category={category} categories={categories ?? []} />
      </div>
      <div className="border-t border-border pt-8">
        <AttributeEditor categoryId={id} attributes={category.attributes} />
      </div>
    </div>
  );
}
