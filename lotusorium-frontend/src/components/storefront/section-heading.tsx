import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "Tümünü Gör",
}: SectionHeadingProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-2xl text-foreground sm:text-3xl">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-clay hover:text-foreground"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
