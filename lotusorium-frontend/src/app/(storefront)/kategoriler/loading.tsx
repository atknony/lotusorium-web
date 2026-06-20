import { Container } from "@/components/storefront/container";

export default function Loading() {
  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6 space-y-2">
        <div className="h-9 w-48 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-xl bg-secondary"
          />
        ))}
      </div>
    </Container>
  );
}
