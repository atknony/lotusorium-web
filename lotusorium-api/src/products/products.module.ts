import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DynamicAttributeValidator } from './dynamic-attribute.validator';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, DynamicAttributeValidator],
  exports: [ProductsService],
})
export class ProductsModule {}
