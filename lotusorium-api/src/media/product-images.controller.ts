import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductImagesService } from './product-images.service';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

@ApiTags('admin-product-images')
@ApiBearerAuth()
@Controller('admin/products/:productId/images')
export class ProductImagesController {
  constructor(private readonly service: ProductImagesService) {}

  @Get()
  list(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.service.list(productId);
  }

  @Post()
  add(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateProductImageDto,
  ) {
    return this.service.add(productId, dto);
  }

  @Patch('reorder')
  reorder(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.service.reorder(productId, dto);
  }

  @Patch(':imageId')
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.service.update(productId, imageId, dto);
  }

  @Delete(':imageId')
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.service.remove(productId, imageId);
  }
}
