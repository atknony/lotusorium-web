import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "./container";

const NAV = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/urunler", label: "Ürünler" },
  { href: "/kategoriler", label: "Kategoriler" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between sm:h-16">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-tight text-foreground sm:text-2xl"
        >
          Lotusorium
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/ara"
          aria-label="Ara"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
        >
          <Search className="h-5 w-5" />
        </Link>
      </Container>
    </header>
  );
}
