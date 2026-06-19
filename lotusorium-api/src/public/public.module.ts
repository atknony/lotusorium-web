import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicProductsController } from './public-products.controller';
import { PublicCategoriesController } from './public-categories.controller';
import { PublicFeaturedController } from './public-featured.controller';

@Module({
  controllers: [
    PublicProductsController,
    PublicCategoriesController,
    PublicFeaturedController,
  ],
  providers: [PublicService],
})
export class PublicModule {}
