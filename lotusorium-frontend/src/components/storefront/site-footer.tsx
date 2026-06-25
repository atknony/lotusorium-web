import Link from "next/link";
import Image from "next/image";
import { Container } from "./container";

const COLUMNS = [
  {
    title: "Keşfet",
    links: [
      { href: "/urunler", label: "Tüm Ürünler" },
      { href: "/kategoriler", label: "Kategoriler" },
      { href: "/ara", label: "Ara" },
    ],
  },
  {
    title: "Kurumsal",
    links: [{ href: "/iletisim", label: "İletişim" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-secondary/40">
      <Container className="py-12 pb-28 lg:pb-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <p className="font-serif text-xl text-foreground">Lotusorium</p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              El yapımı mumlar, ahşap mutfak dekorasyonu ve mum yapım
              malzemeleri. Tüm ürünlerimiz Trendyol mağazamız üzerinden
              satışa sunulmaktadır.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-luxe text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lotusorium. Tüm hakları saklıdır.
        </p>
      </Container>
    </footer>
  );
}
