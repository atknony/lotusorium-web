import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';
import { PUBLIC_CACHE_CONTROL } from './public-cache';

@ApiTags('public')
@Public()
@Controller('products')
export class PublicProductsController {
  constructor(private readonly service: PublicService) {}

  @Get()
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  list(@Query() query: PublicProductsQueryDto) {
    return this.service.listProducts(query);
  }

  @Get(':slug')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  detail(@Param('slug') slug: string) {
    return this.service.getProductBySlug(slug);
  }
}
