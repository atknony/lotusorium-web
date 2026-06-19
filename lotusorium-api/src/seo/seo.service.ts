import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentStatus, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

/**
 * Builds crawler-facing artefacts from published content:
 *  - a standards-compliant sitemap.xml (for search engines)
 *  - a JSON product feed with schema.org facts (for AI/GEO crawlers)
 *
 * URLs are absolute and point at the *storefront* (publicSiteUrl), not the API.
 */
@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get siteUrl(): string {
    return (this.config.get<string>('publicSiteUrl') ?? '').replace(/\/+$/, '');
  }

  private url(path: string): string {
    return `${this.siteUrl}${path}`;
  }

  async buildSitemapXml(): Promise<string> {
    const [products, categories, posts] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: ProductStatus.published, deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.category.findMany({
        where: { isActive: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.blogPost.findMany({
        where: { status: ContentStatus.published },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const entries: SitemapEntry[] = [
      { loc: this.url('/'), changefreq: 'daily', priority: '1.0' },
      ...categories.map((c) => ({
        loc: this.url(`/categories/${c.slug}`),
        lastmod: c.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: '0.7',
      })),
      ...products.map((p) => ({
        loc: this.url(`/products/${p.slug}`),
        lastmod: p.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: '0.8',
      })),
      ...posts.map((b) => ({
        loc: this.url(`/blog/${b.slug}`),
        lastmod: b.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
      })),
    ];

    const body = entries
      .map((e) => {
        const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
        return `  <url>\n    <loc>${escapeXml(e.loc)}</loc>${lastmod}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  }

  async buildProductFeed() {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.published, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const items = products.map((p) => {
      const primary = p.images.find((i) => i.isPrimary) ?? p.images[0] ?? null;
      const price = p.priceAmount === null ? null : Number(p.priceAmount);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        url: this.url(`/products/${p.slug}`),
        description: p.shortDescription ?? p.description ?? null,
        brand: p.brand,
        sku: p.sku,
        category: p.category
          ? { name: p.category.name, slug: p.category.slug }
          : null,
        price,
        priceCurrency: p.priceCurrency,
        image: primary?.url ?? null,
        images: p.images.map((i) => i.url),
        trendyolUrl: p.trendyolUrl,
        attributes: p.attributes,
        availability: 'https://schema.org/InStock',
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      site: this.siteUrl,
      count: items.length,
      products: items,
    };
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
