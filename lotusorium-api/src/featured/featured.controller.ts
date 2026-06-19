import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FeaturedService } from './featured.service';
import { SetFeaturedDto } from './dto/set-featured.dto';

@ApiTags('admin-featured')
@ApiBearerAuth()
@Controller('admin/featured')
export class FeaturedController {
  constructor(private readonly service: FeaturedService) {}

  @Get()
  get() {
    return this.service.getFeatured();
  }

  @Put()
  set(@Body() dto: SetFeaturedDto) {
    return this.service.setFeatured(dto.productIds);
  }
}
