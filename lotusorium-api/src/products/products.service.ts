import { Injectable, NotFoundException } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ensureUniqueSlug, slugify } from '../common/utils/slug.util';
import { DynamicAttributeValidator } from './dynamic-attribute.validator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attributeValidator: DynamicAttributeValidator,
  ) {}

  async create(dto: CreateProductDto) {
    const category = await this.ensureCategory(dto.categoryId);
    const attributes = await this.validateAttributes(
      category.id,
      dto.attributes,
    );
    const slug = await this.buildSlug(dto.slug ?? dto.name);

    return this.prisma.product.create({
      data: {
        categoryId: category.id,
        name: dto.name,
        slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        brand: dto.brand ?? 'Lotusorium',
        sku: dto.sku,
        status: dto.status,
        attributes: attributes as Prisma.InputJsonValue,
        trendyolUrl: dto.trendyolUrl,
        fulfillmentChannel: dto.fulfillmentChannel,
        isFeatured: dto.isFeatured ?? false,
        featuredSortOrder: dto.featuredSortOrder,
        priceAmount: dto.priceAmount,
        priceCurrency: dto.priceCurrency,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        ogImage: dto.ogImage,
        canonicalUrl: dto.canonicalUrl,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  findAll(query: QueryProductsDto) {
    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.ensureExists(id);
    const effectiveCategoryId = dto.categoryId ?? product.categoryId;

    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    const data: Prisma.ProductUpdateInput = {
      name: dto.name,
      shortDescription: dto.shortDescription,
      description: dto.description,
      brand: dto.brand,
      sku: dto.sku,
      status: dto.status,
      trendyolUrl: dto.trendyolUrl,
      fulfillmentChannel: dto.fulfillmentChannel,
      isFeatured: dto.isFeatured,
      featuredSortOrder: dto.featuredSortOrder,
      priceAmount: dto.priceAmount,
      priceCurrency: dto.priceCurrency,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      ogImage: dto.ogImage,
      canonicalUrl: dto.canonicalUrl,
    };

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }
    if (dto.slug) {
      data.slug = await this.buildSlug(dto.slug, id);
    }

    // Re-validate attributes if they changed or the category changed.
    if (dto.attributes !== undefined || dto.categoryId !== undefined) {
      const source =
        dto.attributes ?? (product.attributes as Record<string, unknown>);
      const attributes = await this.validateAttributes(
        effectiveCategoryId,
        source,
      );
      data.attributes = attributes as Prisma.InputJsonValue;
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async restore(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  private async validateAttributes(
    categoryId: string,
    attributes: Record<string, unknown> | undefined | null,
  ) {
    const definitions = await this.prisma.attributeDefinition.findMany({
      where: { categoryId },
    });
    return this.attributeValidator.validate(attributes, definitions);
  }

  private async ensureCategory(categoryId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private buildSlug(source: string, ignoreId?: string): Promise<string> {
    return ensureUniqueSlug(slugify(source), async (candidate) => {
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
      });
      return existing !== null && existing.id !== ignoreId;
    });
  }
}
