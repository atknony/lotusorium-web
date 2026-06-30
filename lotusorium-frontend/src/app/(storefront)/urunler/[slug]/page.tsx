import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { BuyButton } from "@/components/storefront/buy-button";
import { RelatedProducts } from "@/components/storefront/related-products";
import { ApiError } from "@/lib/api/server";
import { getCategories, getProductBySlug, getProducts } from "@/lib/api/storefront";
import { findCategoryBySlug } from "@/lib/categories";
import { buildAttributeRows } from "@/lib/attributes";
import { formatTRY } from "@/lib/utils";
import type { CategoryNode } from "@/lib/api/types";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const res = await getProducts({ limit: 100 }).catch(() => null);
  return (res?.data ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const { product } = await getProductBySlug(slug);
    const title = product.seo.metaTitle ?? product.name;
    const description =
      product.seo.metaDescription ??
      product.shortDescription ??
      `${product.name} — Lotusorium butik koleksiyonu.`;
    const ogImage =
      product.seo.ogImage ??
      product.images.find((i) => i.isPrimary)?.url ??
      product.images[0]?.url;

    return {
      title,
      description,
      alternates: product.seo.canonicalUrl
        ? { canonical: product.seo.canonicalUrl }
        : undefined,
      openGraph: {
        title,
        description,
        type: "website",
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
    };
  } catch {
    return { title: "Ürün" };
  }
}

export default async function ProductDetailPage(props: { params: Params }) {
  const { slug } = await props.params;

  let data;
  try {
    data = await getProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { product, jsonLd } = data;

  // Attribute labels/units come from the (cached) category tree.
  const categories = await getCategories().catch(() => [] as CategoryNode[]);
  const def = product.category
    ? findCategoryBySlug(categories, product.category.slug)
    : undefined;
  const attributeRows = buildAttributeRows(
    product.attributes,
    def?.attributeDefinitions,
  );

  const price = formatTRY(product.priceAmount, product.priceCurrency ?? "TRY");

  // "Benzer Ürünler": other products from the same category. Over-fetch by one
  // so excluding the current product still leaves a full rail; cap at 12.
  const related = product.category
    ? await getProducts({ category: product.category.slug, limit: 13 })
        .then((res) => res.data.filter((p) => p.id !== product.id).slice(0, 12))
        .catch(() => [])
    : [];

  return (
    <Container className="py-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/urunler" className="hover:text-foreground">
          Ürünler
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/kategoriler/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:py-2">
          {product.category && (
            <p className="tracking-luxe text-xs font-medium uppercase text-accent">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          {price && (
            <p className="mt-4 text-2xl font-semibold text-foreground">{price}</p>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-7">
            <BuyButton
              productId={product.id}
              trendyolUrl={product.trendyolUrl}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Satın alma işlemi Trendyol mağazamızda tamamlanır.
            </p>
          </div>

          {attributeRows.length > 0 && (
            <dl className="mt-8 divide-y divide-border border-t border-border">
              {attributeRows.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-medium text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="text-lg text-foreground">Ürün Açıklaması</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && <RelatedProducts products={related} />}
    </Container>
  );
}
