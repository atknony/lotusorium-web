import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api/storefront";
import { flattenCategories } from "@/lib/categories";
import type { CategoryNode } from "@/lib/api/types";

const site = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => [] as CategoryNode[]),
    // API caps limit at 100; sitemap covers the first page (extend with
    // pagination if the catalog grows beyond 100 products).
    getProducts({ limit: 100 }).catch(() => null),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${site}/urunler`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${site}/kategoriler`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = flattenCategories(categories).map(
    (c) => ({
      url: `${site}/kategoriler/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const productRoutes: MetadataRoute.Sitemap = (products?.data ?? []).map((p) => ({
    url: `${site}/urunler/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
