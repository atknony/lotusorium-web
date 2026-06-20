import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Current query string without the `page` param. */
  baseQuery: string;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  baseQuery,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(baseQuery);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <PageLink
        href={href(page - 1)}
        disabled={page <= 1}
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageLink>

      {pages.map((p) => (
        <PageLink key={p} href={href(p)} active={p === page}>
          {p}
        </PageLink>
      ))}

      <PageLink
        href={href(page + 1)}
        disabled={page >= totalPages}
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const className = cn(
    "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-card text-foreground hover:bg-secondary",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled {...rest}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
