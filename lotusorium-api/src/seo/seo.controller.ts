import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PUBLIC_CACHE_CONTROL } from '../public/public-cache';
import { SeoService } from './seo.service';

@ApiTags('seo')
@Public()
@Controller('seo')
export class SeoController {
  constructor(private readonly seo: SeoService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  async sitemap(@Res() res: Response) {
    const xml = await this.seo.buildSitemapXml();
    res.send(xml);
  }

  @Get('feed.json')
  @Header('Cache-Control', PUBLIC_CACHE_CONTROL)
  feed() {
    return this.seo.buildProductFeed();
  }
}
