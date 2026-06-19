import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildProductJsonLd,
  toPublicProduct,
  toPublicProductListItem,
} from '../common/serializers/product.serializer';
import { toPublicCategory } from '../common/serializers/category.serializer';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';

const IMAGE_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
};

function coerceFacet(raw: string | string[]): string | number | boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(query: PublicProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.published,
      deletedAt: null,
    };

    if (query.category) {
      const category = await this.prisma.category.findFirst({
        where: { slug: query.category, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (!category) {
        return this.emptyPage(page, limit);
      }
      where.categoryId = category.id;
    }

    if (query.featured === 'true') {
      where.isFeatured = true;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    if (query.attr) {
      where.AND = Object.entries(query.attr).map(([key, raw]) => ({
        attributes: { path: [key], equals: coerceFacet(raw) },
      }));
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: IMAGE_INCLUDE,
      }),
    ]);

    return {
      data: items.map(toPublicProductListItem),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.published, deletedAt: null },
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return {
      product: toPublicProduct(product),
      jsonLd: buildProductJsonLd(product),
    };
  }

  async listFeatured() {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
        status: ProductStatus.published,
        deletedAt: null,
      },
      orderBy: [{ featuredSortOrder: 'asc' }, { name: 'asc' }],
      include: IMAGE_INCLUDE,
    });
    return products.map(toPublicProductListItem);
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { attributes: { orderBy: { sortOrder: 'asc' } } },
    });

    type Node = ReturnType<typeof toPublicCategory> & {
      parentId: string | null;
      children: Node[];
    };

    const nodes = new Map<string, Node>(
      categories.map((c) => [
        c.id,
        { ...toPublicCategory(c), parentId: c.parentId, children: [] },
      ]),
    );

    const roots: Node[] = [];
    for (const category of categories) {
      const node = nodes.get(category.id)!;
      const parent = category.parentId
        ? nodes.get(category.parentId)
        : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Strip the internal parentId from the response.
    const clean = (node: Node): unknown => {
      const { parentId: _parentId, children, ...rest } = node;
      return { ...rest, children: children.map(clean) };
    };
    return roots.map(clean);
  }

  async getCategoryBySlug(slug: string, query: PublicProductsQueryDto) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      include: { attributes: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    const products = await this.listProducts({ ...query, category: slug });
    return { category: toPublicCategory(category), products };
  }

  private emptyPage(page: number, limit: number) {
    return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
  }
}
