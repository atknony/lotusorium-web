import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';

@Module({
  controllers: [MediaController, ProductImagesController],
  providers: [CloudinaryService, ProductImagesService],
  exports: [CloudinaryService],
})
export class MediaModule {}
