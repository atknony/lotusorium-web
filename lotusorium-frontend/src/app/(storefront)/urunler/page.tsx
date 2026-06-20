import type { Metadata } from "next";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductFilters } from "@/components/storefront/product-filters";
import { Pagination } from "@/components/storefront/pagination";
import { getCategories, getProducts } from "@/lib/api/storefront";
import { flattenCategories, findCategoryBySlug } from "@/lib/categories";
import {
  baseQueryWithoutPage,
  parseStorefrontParams,
  type RawSearchParams,
} from "@/lib/storefront-params";
import type { CategoryNode } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Ürünler",
  description:
    "Lotusorium koleksiyonundaki tüm el yapımı mumları ve ahşap dekorasyon ürünlerini keşfedin.",
};

export default async function ProductsPage(props: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await props.searchParams;
  const { query, selection, page, search } = parseStorefrontParams(raw);

  const [categoryTree, productsRes] = await Promise.all([
    getCategories().catch(() => [] as CategoryNode[]),
    getProducts(query),
  ]);

  const categories = flattenCategories(categoryTree);
  const activeCategory = selection.category
    ? findCategoryBySlug(categoryTree, selection.category)
    : undefined;

  const { data: products, meta } = productsRes;

  return (
    <Container className="py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl text-foreground sm:text-4xl">Ürünler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meta.total} ürün
          {search ? ` · “${search}” için sonuçlar` : ""}
        </p>
      </header>

      <ProductFilters
        categories={categories}
        attributes={activeCategory?.filterableAttributes}
        selected={selection}
        basePath="/urunler"
        search={search}
      />

      <div className="mt-8">
        <ProductGrid products={products} priorityCount={4} />
      </div>

      <Pagination
        page={page}
        totalPages={meta.totalPages}
        basePath="/urunler"
        baseQuery={baseQueryWithoutPage(raw)}
      />
    </Container>
  );
}
