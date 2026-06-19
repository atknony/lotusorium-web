import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(productId: string) {
    await this.ensureProduct(productId);
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async add(productId: string, dto: CreateProductImageDto) {
    await this.ensureProduct(productId);

    const count = await this.prisma.productImage.count({ where: { productId } });
    // First image of a product is primary by default.
    const isPrimary = dto.isPrimary ?? count === 0;

    return this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.productImage.create({
        data: {
          productId,
          cloudinaryPublicId: dto.cloudinaryPublicId,
          url: dto.url,
          altText: dto.altText,
          width: dto.width,
          height: dto.height,
          isPrimary,
          sortOrder: count,
        },
      });
    });
  }

  async update(productId: string, imageId: string, dto: UpdateProductImageDto) {
    await this.ensureImage(productId, imageId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.productImage.update({
        where: { id: imageId },
        data: { altText: dto.altText, isPrimary: dto.isPrimary },
      });
    });
  }

  async reorder(productId: string, dto: ReorderImagesDto) {
    await this.ensureProduct(productId);
    const images = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });
    const owned = new Set(images.map((i) => i.id));

    if (
      dto.orderedIds.length !== images.length ||
      dto.orderedIds.some((id) => !owned.has(id))
    ) {
      throw new BadRequestException(
        'orderedIds must contain exactly the image ids of this product',
      );
    }

    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.productImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.list(productId);
  }

  async remove(productId: string, imageId: string) {
    const image = await this.ensureImage(productId, imageId);
    // Remove the Cloudinary asset first; if that fails we keep the DB row so
    // the operation can be retried rather than orphaning the asset.
    await this.cloudinary.destroy(image.cloudinaryPublicId);
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { success: true };
  }

  private async ensureProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private async ensureImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Product image not found');
    }
    return image;
  }
}
