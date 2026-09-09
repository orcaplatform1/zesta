import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import type { StorageProvider } from './storage.interface.js';
import { STORAGE_PROVIDER } from './storage.token.js';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

@Controller('media/admin')
@UseGuards(AdminAuthGuard)
export class MediaController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    if (!ALLOWED_TYPES.has(file.mimetype)) throw new BadRequestException('Desteklenmeyen dosya türü');

    return this.storage.upload(file);
  }
}
