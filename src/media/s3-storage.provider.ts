import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { StorageProvider, UploadedFileInput } from './storage.interface.js';

// Cloudflare R2 (S3-uyumlu) için — S3_* env değişkenleri girilince STORAGE_PROVIDER=s3 yapılarak devreye alınır.
@Injectable()
export class S3StorageProvider implements StorageProvider {
  constructor(private readonly config: ConfigService) {}

  // getOrThrow çağrıları bilerek constructor'da değil burada — S3 env'leri boşken bile
  // bu provider sorunsuz instantiate edilebilsin (sadece gerçekten kullanılınca hata versin).
  private getClient() {
    return new S3Client({
      region: this.config.get<string>('S3_REGION') ?? 'auto',
      endpoint: this.config.getOrThrow<string>('S3_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(file: UploadedFileInput): Promise<{ url: string }> {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    const publicUrl = this.config.getOrThrow<string>('S3_PUBLIC_URL');
    const key = `${randomUUID()}${extname(file.originalname)}`;

    await this.getClient().send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }),
    );
    return { url: `${publicUrl.replace(/\/$/, '')}/${key}` };
  }
}
