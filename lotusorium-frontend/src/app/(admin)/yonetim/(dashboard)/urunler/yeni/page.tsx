import type { Metadata } from "next";
import { ProductCreateView } from "@/components/admin/products/product-views";

export const metadata: Metadata = { title: "Yeni Ürün" };

export default function NewProductPage() {
  return <ProductCreateView />;
}
