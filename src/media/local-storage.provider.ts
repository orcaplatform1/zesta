import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import type { StorageProvider, UploadedFileInput } from './storage.interface.js';

const UPLOAD_DIR = join(process.cwd(), 'storage', 'uploads');

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async upload(file: UploadedFileInput): Promise<{ url: string }> {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${extname(file.originalname)}`;
    await writeFile(join(UPLOAD_DIR, filename), file.buffer);
    // nginx /api/ konumu backend'e proxy'lerken prefix'i düşürüyor, bu yüzden
    // frontend'den erişim için /api/media/... döndürüyoruz (bkz. zesta.tr nginx conf).
    return { url: `/api/media/${filename}` };
  }
}
