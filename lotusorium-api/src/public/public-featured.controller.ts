import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { PUBLIC_CACHE_CONTROL } from './public-cache';

@ApiTags('public')
@Public()
@Controller('featured')
export class PublicFeaturedController {
  constructor(private readonly service: PublicService) {}

  @Get()
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  list() {
    return this.service.listFeatured();
  }
}
