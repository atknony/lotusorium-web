import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryNode } from "@/lib/api/types";
import { ProductImage } from "./product-image";

export function CategoryCard({ category }: { category: CategoryNode }) {
  return (
    <Link
      href={`/kategoriler/${category.slug}`}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl bg-secondary p-4 ring-1 ring-border/60 transition-transform duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <div className="absolute inset-0">
        <ProductImage
          src={category.imageUrl}
          alt={category.name}
          sizes="(max-width: 640px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <h3 className="text-balance text-base font-medium leading-tight text-white drop-shadow-sm">
          {category.name}
        </h3>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-white/90 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
