"use client";

import { useEffect, useRef, useState } from "react";
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
  // While we drive a programmatic (smooth) scroll from a thumbnail click, the
  // browser emits a stream of `scroll` events. Without this guard, onScroll
  // would recompute `active` through every slide the animation passes over,
  // making the active thumbnail flicker instead of landing cleanly on the
  // target. The flag is cleared once scrolling settles.
  const programmaticRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    setActive(i);
    programmaticRef.current = true;
    // Match onScroll's index math (full-width slides) for a consistent target.
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    // Settle the active index only after scrolling pauses, so neither a user
    // swipe nor a programmatic scroll flickers through intermediate slides.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (programmaticRef.current) {
        // Our smooth-scroll has finished — resume reacting to user scrolls.
        programmaticRef.current = false;
        return;
      }
      if (!track.clientWidth) return;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      setActive((prev) => (prev !== i ? i : prev));
    }, 80);
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
              onClick={() => goTo(i)}
              aria-label={`Görsel ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-secondary ring-2 transition-opacity duration-200",
                active === i
                  ? "opacity-100 ring-primary"
                  : "opacity-70 ring-transparent hover:opacity-100",
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
