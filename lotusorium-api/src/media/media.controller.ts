import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';
import { SignUploadDto } from './dto/sign-upload.dto';

@ApiTags('admin-media')
@ApiBearerAuth()
@Controller('admin/media')
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /** Returns short-lived signed params for a direct browser->Cloudinary upload. */
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  sign(@Body() dto: SignUploadDto) {
    return this.cloudinary.signUpload(dto.folder);
  }
}
