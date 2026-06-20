import type { ProductListItem } from "@/lib/api/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: ProductListItem[];
  priorityCount?: number;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  priorityCount = 0,
  emptyMessage = "Bu seçimle eşleşen ürün bulunamadı.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={i < priorityCount}
        />
      ))}
    </div>
  );
}
