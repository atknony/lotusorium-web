import { Container } from "@/components/storefront/container";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <div className="h-9 w-40 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-full bg-secondary"
          />
        ))}
      </div>
      <ProductGridSkeleton />
    </Container>
  );
}
