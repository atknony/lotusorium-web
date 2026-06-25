import type { Metadata } from "next";
// lucide-react dropped brand glyphs (no `Instagram`); Camera is the closest fit.
import { ArrowUpRight, Camera, Mail, ShoppingBag } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { Reveal } from "@/components/storefront/reveal";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "Otel, özel gün ve kurumsal toplu sipariş talepleriniz ile her türlü soru ve görüşünüz için Lotusorium ile iletişime geçin.",
};

const CHANNELS = [
  {
    label: "E-posta",
    value: "oriumlotus@gmail.com",
    href: "mailto:oriumlotus@gmail.com",
    icon: Mail,
    external: false,
  },
  {
    label: "Instagram",
    value: "@lotusorium",
    href: "https://www.instagram.com/lotusorium/",
    icon: Camera,
    external: true,
  },
  {
    label: "Trendyol Mağazası",
    value: "Koleksiyonu Trendyol'da inceleyin",
    href: "https://www.trendyol.com/magaza/lotusorium-m-1092177?sst=0&channelId=1&subPathStrategy=no-subpath&event=0",
    icon: ShoppingBag,
    external: true,
  },
] as const;

export default function ContactPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="tracking-luxe text-xs font-medium uppercase text-accent">
          İletişim
        </p>
        <h1 className="mt-4 text-balance text-3xl leading-tight text-foreground sm:text-4xl">
          Bizimle iletişime geçin
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground">
          Otel, özel gün (düğün, nişan vb.) ve kurumsal toplu sipariş
          talepleriniz ile her türlü soru ve görüşünüz için bizimle iletişime
          geçebilirsiniz.
        </p>
      </div>

      <Reveal className="mx-auto mt-10 max-w-xl">
        <ul className="space-y-3">
          {CHANNELS.map(({ label, value, href, icon: Icon, external }) => (
            <li key={href}>
              <a
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-clay/40 hover:bg-secondary/40 active:scale-[0.99] motion-reduce:active:scale-100 sm:p-5"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-clay transition-colors group-hover:bg-clay group-hover:text-white">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {label}
                  </span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {value}
                  </span>
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden
                />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </Container>
  );
}
