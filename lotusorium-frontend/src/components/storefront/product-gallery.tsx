"use client";

import { useRef, useState } from "react";
import type { ProductImage as ProductImageType } from "@/lib/api/types";
import { ProductImage } from "./product-image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImageType[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    setActive(i);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== active) setActive(i);
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
        <ProductImage src={null} alt={name} sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
      >
        {images.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            className="relative aspect-square w-full shrink-0 snap-center bg-secondary"
          >
            <ProductImage
              src={img.url}
              alt={img.altText ?? name}
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={`thumb-${img.url}-${i}`}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Görsel ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-secondary ring-2 transition-all",
                active === i ? "ring-primary" : "ring-transparent opacity-70",
              )}
            >
              <ProductImage src={img.url} alt={img.altText ?? name} sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
