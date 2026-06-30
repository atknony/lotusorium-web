"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductListItem } from "@/lib/api/types";
import { ProductCard } from "./product-card";

interface RelatedProductsProps {
  products: ProductListItem[];
}

/**
 * Horizontal "Benzer Ürünler" rail shown under the product detail.
 *
 * Overflow is contained to THIS element (`overflow-x-auto` + scroll-snap), so it
 * can never push the page wide on any viewport. The negative margins exactly
 * cancel the parent `Container` padding (`px-4 sm:px-6`), letting cards bleed to
 * the screen edge for a natural mobile swipe while the re-applied padding keeps
 * the first/last card aligned with the page gutter. Desktop adds prev/next
 * buttons; mobile relies on touch + the native momentum scroll.
 */
export function RelatedProducts({ products }: RelatedProductsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByPage(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section className="mt-14 border-t border-border pt-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl text-foreground sm:text-2xl">Benzer Ürünler</h2>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Önceki ürünler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Sonraki ürünler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:gap-5 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-40 shrink-0 snap-start sm:w-48 lg:w-56"
          >
            <ProductCard
              product={product}
              sizes="(max-width: 640px) 40vw, 224px"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
