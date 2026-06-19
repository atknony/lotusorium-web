import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttributeDataType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

const ENUM_TYPES: AttributeDataType[] = [
  AttributeDataType.enum,
  AttributeDataType.multi_enum,
];

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(categoryId: string, dto: CreateAttributeDefinitionDto) {
    await this.ensureCategory(categoryId);
    this.assertOptions(dto.dataType, dto.options);

    const clash = await this.prisma.attributeDefinition.findUnique({
      where: { categoryId_key: { categoryId, key: dto.key } },
    });
    if (clash) {
      throw new ConflictException(
        `Attribute "${dto.key}" already exists for this category`,
      );
    }

    return this.prisma.attributeDefinition.create({
      data: {
        categoryId,
        key: dto.key,
        label: dto.label,
        dataType: dto.dataType,
        unit: dto.unit,
        options: dto.options ?? Prisma.JsonNull,
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAll(categoryId: string) {
    await this.ensureCategory(categoryId);
    return this.prisma.attributeDefinition.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(
    categoryId: string,
    id: string,
    dto: UpdateAttributeDefinitionDto,
  ) {
    const existing = await this.ensureExists(categoryId, id);

    const effectiveType = dto.dataType ?? existing.dataType;
    const effectiveOptions =
      dto.options ?? (existing.options as string[] | null) ?? undefined;
    this.assertOptions(effectiveType, effectiveOptions);

    if (dto.key && dto.key !== existing.key) {
      const clash = await this.prisma.attributeDefinition.findUnique({
        where: { categoryId_key: { categoryId, key: dto.key } },
      });
      if (clash) {
        throw new ConflictException(
          `Attribute "${dto.key}" already exists for this category`,
        );
      }
    }

    const data: Prisma.AttributeDefinitionUpdateInput = {
      key: dto.key,
      label: dto.label,
      dataType: dto.dataType,
      unit: dto.unit,
      isRequired: dto.isRequired,
      isFilterable: dto.isFilterable,
      sortOrder: dto.sortOrder,
    };
    if (dto.options !== undefined) {
      data.options = dto.options;
    }

    return this.prisma.attributeDefinition.update({ where: { id }, data });
  }

  async remove(categoryId: string, id: string) {
    await this.ensureExists(categoryId, id);
    await this.prisma.attributeDefinition.delete({ where: { id } });
    return { success: true };
  }

  private assertOptions(
    dataType: AttributeDataType,
    options?: string[] | null,
  ): void {
    if (ENUM_TYPES.includes(dataType) && (!options || options.length === 0)) {
      throw new BadRequestException(
        `"${dataType}" attributes require a non-empty "options" array`,
      );
    }
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async ensureExists(categoryId: string, id: string) {
    const definition = await this.prisma.attributeDefinition.findFirst({
      where: { id, categoryId },
    });
    if (!definition) {
      throw new NotFoundException('Attribute definition not found');
    }
    return definition;
  }
}
