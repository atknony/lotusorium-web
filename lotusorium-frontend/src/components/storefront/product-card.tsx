import Link from "next/link";
import type { ProductListItem } from "@/lib/api/types";
import { formatTRY } from "@/lib/utils";
import { ProductImage } from "./product-image";

interface ProductCardProps {
  product: ProductListItem;
  priority?: boolean;
  sizes?: string;
}

export function ProductCard({ product, priority, sizes }: ProductCardProps) {
  const price = formatTRY(product.priceAmount, product.priceCurrency ?? "TRY");

  return (
    <Link
      href={`/urunler/${product.slug}`}
      className="group block transition-transform duration-200 active:scale-[0.98] focus-visible:outline-none motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary ring-1 ring-border/60 transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <ProductImage
          src={product.primaryImage?.url ?? null}
          alt={product.primaryImage?.altText ?? product.name}
          priority={priority}
          sizes={sizes}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-luxe text-clay backdrop-blur">
            Öne Çıkan
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.name}
        </h3>
        {product.shortDescription ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {product.shortDescription}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{product.brand}</p>
        )}
        {price && (
          <p className="pt-0.5 text-sm font-semibold text-foreground">{price}</p>
        )}
      </div>
    </Link>
  );
}
