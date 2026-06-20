"use client";

import Image from "next/image";
import { useState } from "react";
import { Flame } from "lucide-react";
import { cloudinaryLoader } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Fills its (positioned) parent. Falls back to a tasteful placeholder when
 * there's no image or the upstream fails to load — common in seed data.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority,
  className,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary">
        <Flame className="h-8 w-8 text-clay/30" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
