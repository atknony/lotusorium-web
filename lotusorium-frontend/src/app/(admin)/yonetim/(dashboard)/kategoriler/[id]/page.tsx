import type { Metadata } from "next";
import { CategoryEditView } from "@/components/admin/categories/category-views";

export const metadata: Metadata = { title: "Kategori Düzenle" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryEditView id={id} />;
}
