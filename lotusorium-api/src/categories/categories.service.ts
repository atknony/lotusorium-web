import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ensureUniqueSlug, slugify } from '../common/utils/slug.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }
    const slug = await this.buildSlug(dto.slug ?? dto.name);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        ogImage: dto.ogImage,
        canonicalUrl: dto.canonicalUrl,
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        attributes: { orderBy: { sortOrder: 'asc' } },
        children: { where: { deletedAt: null } },
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.ensureExists(dto.parentId);
    }

    const data: Prisma.CategoryUpdateInput = {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      ogImage: dto.ogImage,
      canonicalUrl: dto.canonicalUrl,
    };
    if (dto.slug) {
      data.slug = await this.buildSlug(dto.slug, id);
    }
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  private async ensureExists(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private buildSlug(source: string, ignoreId?: string): Promise<string> {
    return ensureUniqueSlug(slugify(source), async (candidate) => {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
      });
      return existing !== null && existing.id !== ignoreId;
    });
  }
}
