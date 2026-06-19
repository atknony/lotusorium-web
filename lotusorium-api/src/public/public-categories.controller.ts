import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';
import { PUBLIC_CACHE_CONTROL } from './public-cache';

@ApiTags('public')
@Public()
@Controller('categories')
export class PublicCategoriesController {
  constructor(private readonly service: PublicService) {}

  @Get()
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  list() {
    return this.service.listCategories();
  }

  @Get(':slug')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  detail(
    @Param('slug') slug: string,
    @Query() query: PublicProductsQueryDto,
  ) {
    return this.service.getCategoryBySlug(slug, query);
  }
}
