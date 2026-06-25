import type { Metadata } from "next";
import { Container } from "@/components/storefront/container";
import { CategoryCard } from "@/components/storefront/category-card";
import { getCategories } from "@/lib/api/storefront";
import type { CategoryNode } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Lotusorium koleksiyonunu kategoriye göre keşfedin: mumlar, ahşap mutfak dekorasyonu ve mum yapım malzemeleri.",
};

export default async function CategoriesPage() {
  const categories = await getCategories().catch(() => [] as CategoryNode[]);

  return (
    <Container className="py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl text-foreground sm:text-4xl">Kategoriler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İlham veren koleksiyonları keşfedin
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Henüz kategori eklenmemiş.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {categories.map((category, i) => (
            <CategoryCard
              key={category.id}
              category={category}
              priority={i < 4}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
