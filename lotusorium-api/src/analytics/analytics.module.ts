import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ClickController } from './click.controller';

@Module({
  controllers: [ClickController, AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
