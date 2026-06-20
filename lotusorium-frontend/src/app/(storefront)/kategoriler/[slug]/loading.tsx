import { Container } from "@/components/storefront/container";
import { ProductGridSkeleton } from "@/components/storefront/product-grid-skeleton";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-52 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-secondary" />
      </div>
      <ProductGridSkeleton />
    </Container>
  );
}
