export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-xl bg-secondary" />
          <div className="mt-3 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-secondary" />
            <div className="h-3 w-1/2 rounded bg-secondary" />
            <div className="h-3.5 w-1/3 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
