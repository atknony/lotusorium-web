import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryCard } from "@/components/storefront/category-card";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, getFeatured } from "@/lib/api/storefront";
import type { CategoryNode, ProductListItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  // Degrade gracefully if a section's data is briefly unavailable.
  const [featured, categories] = await Promise.all([
    getFeatured().catch(() => [] as ProductListItem[]),
    getCategories().catch(() => [] as CategoryNode[]),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary/50 to-background">
        <Container className="py-16 text-center sm:py-24 lg:py-28">
          <p className="tracking-luxe text-xs font-medium uppercase text-accent">
            Butik Koleksiyon
          </p>
          <h1 className="mx-auto mt-5 max-w-2xl text-balance text-4xl leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
            Evinize sıcaklık katan el yapımı dokunuşlar
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            Özenle hazırlanmış mumlar, ahşap mutfak dekorasyonu ve mum yapım
            malzemeleri. Doğal, sade ve zarif.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/urunler"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Koleksiyonu Keşfet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/kategoriler"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Kategoriler
            </Link>
          </div>
        </Container>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <Container className="py-14">
          <SectionHeading
            title="Öne Çıkanlar"
            subtitle="Sezonun gözde parçaları"
            href="/urunler?featured=true"
          />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible">
            {featured.map((product, i) => (
              <div
                key={product.id}
                className="w-44 shrink-0 snap-start sm:w-52 lg:w-auto"
              >
                <ProductCard product={product} priority={i < 2} />
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Container className="py-14">
          <SectionHeading
            title="Kategoriler"
            subtitle="İlham veren koleksiyonları keşfedin"
            href="/kategoriler"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
