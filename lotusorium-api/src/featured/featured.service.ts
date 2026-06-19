import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeaturedService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current featured products in display order (admin view, any status). */
  getFeatured() {
    return this.prisma.product.findMany({
      where: { isFeatured: true, deletedAt: null },
      orderBy: [{ featuredSortOrder: 'asc' }, { name: 'asc' }],
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /**
   * Replaces the entire featured set: the given products become featured in
   * the supplied order; every other product is un-featured.
   */
  async setFeatured(productIds: string[]) {
    const ids = [...new Set(productIds)];

    if (ids.length > 0) {
      const found = await this.prisma.product.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true },
      });
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `Unknown or deleted product ids: ${missing.join(', ')}`,
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.product.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false, featuredSortOrder: null },
      }),
      ...ids.map((id, index) =>
        this.prisma.product.update({
          where: { id },
          data: { isFeatured: true, featuredSortOrder: index },
        }),
      ),
    ]);

    return this.getFeatured();
  }
}
