import type { ImageLoaderProps } from "next/image";

/**
 * The API returns full Cloudinary delivery URLs:
 *   https://res.cloudinary.com/<cloud>/image/upload/<public_id>
 * We inject responsive + format/quality transforms right after `/upload/` so
 * the browser gets AVIF/WebP at the right size via the CDN.
 */
function withTransforms(src: string, transforms: string): string {
  const marker = "/upload/";
  const idx = src.indexOf(marker);
  if (idx === -1) return src; // not a Cloudinary upload URL — leave untouched
  const head = src.slice(0, idx + marker.length);
  const tail = src.slice(idx + marker.length);
  return `${head}${transforms}/${tail}`;
}

/**
 * next/image `loader` for Cloudinary-hosted product imagery.
 * Usage: <Image loader={cloudinaryLoader} src={image.url} ... />
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const t = ["f_auto", `q_${quality ?? "auto"}`, "c_limit", `w_${width}`];
  return withTransforms(src, t.join(","));
}

/** Build a one-off responsive Cloudinary URL (e.g. for OG images, previews). */
export function cloudinaryUrl(
  src: string,
  { width, height, quality = "auto" }: { width?: number; height?: number; quality?: number | "auto" } = {},
): string {
  const t = ["f_auto", `q_${quality}`];
  if (width) t.push(`w_${width}`);
  if (height) t.push(`h_${height}`, "c_fill");
  return withTransforms(src, t.join(","));
}
