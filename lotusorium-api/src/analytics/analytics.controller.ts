import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('admin-analytics')
@ApiBearerAuth()
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  dashboard() {
    return this.analytics.getDashboard();
  }

  @Get('analytics/clicks')
  clicks(@Query() query: AnalyticsQueryDto) {
    return this.analytics.getClickAnalytics(query);
  }

  @Post('analytics/refresh')
  @HttpCode(HttpStatus.OK)
  refresh() {
    return this.analytics.refreshRollups();
  }
}
