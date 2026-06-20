import type { Metadata } from "next";
import { CategoryCreateView } from "@/components/admin/categories/category-views";

export const metadata: Metadata = { title: "Yeni Kategori" };

export default function NewCategoryPage() {
  return <CategoryCreateView />;
}
