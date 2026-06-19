import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

interface ClickMeta {
  ip?: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private hashIp(ip?: string): string | null {
    if (!ip) return null;
    return createHash('sha256').update(ip).digest('hex');
  }

  /**
   * Records a Trendyol redirect click (append-only event + rollup increment)
   * and returns the product's Trendyol URL for the redirect.
   */
  async recordClick(productId: string, meta: ClickMeta) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: ProductStatus.published, deletedAt: null },
      select: { id: true, trendyolUrl: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.redirectClick.create({
        data: {
          productId,
          referrer: meta.referrer,
          userAgent: meta.userAgent,
          ipHash: this.hashIp(meta.ip),
          sessionId: meta.sessionId,
          clickedAt: now,
        },
      }),
      this.prisma.productClickStats.upsert({
        where: { productId },
        create: { productId, totalClicks: 1, lastClickedAt: now },
        update: { totalClicks: { increment: 1 }, lastClickedAt: now },
      }),
    ]);

    return { trendyolUrl: product.trendyolUrl };
  }

  /** Admin summary for the dashboard home. */
  async getDashboard() {
    const now = Date.now();
    const since7d = new Date(now - 7 * DAY_MS);
    const since30d = new Date(now - 30 * DAY_MS);

    const [
      totalProducts,
      publishedProducts,
      featuredProducts,
      totalCategories,
      totalClicks,
      clicks7d,
      clicks30d,
      topStats,
      recent,
    ] = await this.prisma.$transaction([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({
        where: { deletedAt: null, status: ProductStatus.published },
      }),
      this.prisma.product.count({
        where: { deletedAt: null, isFeatured: true },
      }),
      this.prisma.category.count({ where: { deletedAt: null } }),
      this.prisma.redirectClick.count(),
      this.prisma.redirectClick.count({
        where: { clickedAt: { gte: since7d } },
      }),
      this.prisma.redirectClick.count({
        where: { clickedAt: { gte: since30d } },
      }),
      this.prisma.productClickStats.findMany({
        where: { product: { deletedAt: null } },
        orderBy: { totalClicks: 'desc' },
        take: 5,
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.redirectClick.findMany({
        orderBy: { clickedAt: 'desc' },
        take: 10,
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

    return {
      totals: {
        products: totalProducts,
        publishedProducts,
        featuredProducts,
        categories: totalCategories,
        totalClicks,
        clicks7d,
        clicks30d,
      },
      topProducts: topStats.map((s) => ({
        productId: s.productId,
        name: s.product.name,
        slug: s.product.slug,
        totalClicks: s.totalClicks,
        lastClickedAt: s.lastClickedAt,
      })),
      recentClicks: recent.map((c) => ({
        productId: c.productId,
        name: c.product.name,
        slug: c.product.slug,
        clickedAt: c.clickedAt,
      })),
    };
  }

  /** Per-product click counts, optionally constrained to a date range. */
  async getClickAnalytics(query: AnalyticsQueryDto) {
    const range: Prisma.DateTimeFilter = {};
    if (query.from) range.gte = new Date(query.from);
    if (query.to) range.lte = new Date(query.to);
    const where: Prisma.RedirectClickWhereInput = {};
    if (query.from || query.to) where.clickedAt = range;

    const grouped = await this.prisma.redirectClick.groupBy({
      by: ['productId'],
      where,
      _count: { _all: true },
      _max: { clickedAt: true },
      orderBy: { _count: { productId: 'desc' } },
    });

    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true, slug: true, deletedAt: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    return {
      range: { from: query.from ?? null, to: query.to ?? null },
      items: grouped.map((g) => {
        const product = byId.get(g.productId);
        return {
          productId: g.productId,
          name: product?.name ?? null,
          slug: product?.slug ?? null,
          isDeleted: product ? product.deletedAt !== null : true,
          clicks: g._count._all,
          lastClickedAt: g._max.clickedAt,
        };
      }),
    };
  }

  /**
   * Recomputes the rolling clicks7d / clicks30d columns on product_click_stats.
   * Intended to be run on a schedule; also exposed as an admin action.
   */
  async refreshRollups() {
    const now = Date.now();
    const since7d = new Date(now - 7 * DAY_MS);
    const since30d = new Date(now - 30 * DAY_MS);

    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    for (const { id } of products) {
      const [clicks7d, clicks30d] = await Promise.all([
        this.prisma.redirectClick.count({
          where: { productId: id, clickedAt: { gte: since7d } },
        }),
        this.prisma.redirectClick.count({
          where: { productId: id, clickedAt: { gte: since30d } },
        }),
      ]);
      await this.prisma.productClickStats.upsert({
        where: { productId: id },
        create: { productId: id, clicks7d, clicks30d },
        update: { clicks7d, clicks30d },
      });
    }

    return { refreshed: products.length };
  }
}
