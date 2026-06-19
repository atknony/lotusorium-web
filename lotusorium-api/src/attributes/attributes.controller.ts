import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';

@ApiTags('admin-attributes')
@ApiBearerAuth()
@Controller('admin/categories/:categoryId/attributes')
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Post()
  create(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: CreateAttributeDefinitionDto,
  ) {
    return this.service.create(categoryId, dto);
  }

  @Get()
  findAll(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.service.findAll(categoryId);
  }

  @Patch(':id')
  update(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeDefinitionDto,
  ) {
    return this.service.update(categoryId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(categoryId, id);
  }
}
