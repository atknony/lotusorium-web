import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/storefront/container";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductFilters } from "@/components/storefront/product-filters";
import { Pagination } from "@/components/storefront/pagination";
import { ApiError } from "@/lib/api/server";
import { getCategoryBySlug } from "@/lib/api/storefront";
import {
  baseQueryWithoutPage,
  parseStorefrontParams,
  type RawSearchParams,
} from "@/lib/storefront-params";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<RawSearchParams>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const { category } = await getCategoryBySlug(slug);
    return {
      title: category.seo.metaTitle ?? category.name,
      description:
        category.seo.metaDescription ?? category.description ?? undefined,
    };
  } catch {
    return { title: "Kategori" };
  }
}

export default async function CategoryDetailPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await props.params;
  const raw = await props.searchParams;
  const { query, selection, page, search } = parseStorefrontParams(raw);

  let data;
  try {
    data = await getCategoryBySlug(slug, { ...query, category: undefined });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { category, products } = data;

  return (
    <Container className="py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="text-3xl text-foreground sm:text-4xl">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {products.meta.total} ürün
        </p>
      </header>

      {category.filterableAttributes.length > 0 && (
        <ProductFilters
          attributes={category.filterableAttributes}
          selected={selection}
          basePath={`/kategoriler/${slug}`}
          search={search}
        />
      )}

      <div className="mt-8">
        <ProductGrid products={products.data} priorityCount={4} />
      </div>

      <Pagination
        page={page}
        totalPages={products.meta.totalPages}
        basePath={`/kategoriler/${slug}`}
        baseQuery={baseQueryWithoutPage(raw)}
      />
    </Container>
  );
}
