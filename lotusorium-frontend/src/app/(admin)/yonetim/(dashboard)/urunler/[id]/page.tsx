import type { Metadata } from "next";
import { ProductEditView } from "@/components/admin/products/product-views";

export const metadata: Metadata = { title: "Ürün Düzenle" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductEditView id={id} />;
}
