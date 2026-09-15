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
import { DesignerAuthGuard } from '../auth/guards/designer-auth.guard.js';
import type { StorageProvider } from './storage.interface.js';
import { STORAGE_PROVIDER } from './storage.token.js';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

@Controller('media')
export class MediaController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  @Post('admin/upload')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  uploadAsAdmin(@UploadedFile() file?: Express.Multer.File) {
    return this.upload(file);
  }

  // Tasarımcı Paneli'nde ürün görseli yüklemek için — admin uç noktasından
  // ayrı tutulur ki tasarımcı hesapları admin yetkisi kazanmasın.
  @Post('designer/upload')
  @UseGuards(DesignerAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE } }))
  uploadAsDesigner(@UploadedFile() file?: Express.Multer.File) {
    return this.upload(file);
  }

  private async upload(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    if (!ALLOWED_TYPES.has(file.mimetype)) throw new BadRequestException('Desteklenmeyen dosya türü');

    return this.storage.upload(file);
  }
}
