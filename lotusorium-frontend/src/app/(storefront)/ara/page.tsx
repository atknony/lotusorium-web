import type { Metadata } from "next";
import { Container } from "@/components/storefront/container";
import { SearchBox } from "@/components/storefront/search-box";
import { ProductGrid } from "@/components/storefront/product-grid";
import { getProducts } from "@/lib/api/storefront";

export const metadata: Metadata = {
  title: "Ara",
  description: "Lotusorium koleksiyonunda ürün arayın.",
};

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await props.searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";

  const results = q ? await getProducts({ search: q, limit: 24 }) : null;

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-3xl text-foreground sm:text-4xl">Ara</h1>

      <div className="mt-5 max-w-xl">
        <SearchBox initialQuery={q} />
      </div>

      {results && (
        <div className="mt-8">
          <p className="mb-5 text-sm text-muted-foreground">
            “{q}” için {results.meta.total} sonuç
          </p>
          <ProductGrid
            products={results.data}
            priorityCount={4}
            emptyMessage={`“${q}” için ürün bulunamadı.`}
          />
        </div>
      )}

      {!results && (
        <p className="mt-8 text-sm text-muted-foreground">
          Aramak istediğiniz ürünü yukarıya yazın.
        </p>
      )}
    </Container>
  );
}
