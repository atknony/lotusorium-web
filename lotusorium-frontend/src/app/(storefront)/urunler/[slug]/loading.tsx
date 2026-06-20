import { Container } from "@/components/storefront/container";

export default function Loading() {
  return (
    <Container className="py-6 sm:py-10">
      <div className="mb-5 h-3.5 w-40 animate-pulse rounded bg-secondary" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-2xl bg-secondary" />
        <div className="space-y-4 lg:py-2">
          <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-secondary" />
          <div className="h-7 w-32 animate-pulse rounded bg-secondary" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-secondary" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
