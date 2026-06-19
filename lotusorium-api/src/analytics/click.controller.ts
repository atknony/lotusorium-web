import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AnalyticsService } from './analytics.service';
import { RecordClickDto } from './dto/record-click.dto';

@ApiTags('public')
@Public()
@Controller('products')
export class ClickController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Records a Trendyol redirect click and returns the target URL.
   * Stricter rate limit than the global default to blunt click inflation.
   */
  @Post(':id/click')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  click(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordClickDto,
    @Req() req: Request,
  ) {
    return this.analytics.recordClick(id, {
      ip: req.ip,
      referrer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      sessionId: dto.sessionId,
    });
  }
}
