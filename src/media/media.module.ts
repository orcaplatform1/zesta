import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { LocalStorageProvider } from './local-storage.provider.js';
import { MediaController } from './media.controller.js';
import { S3StorageProvider } from './s3-storage.provider.js';
import { STORAGE_PROVIDER } from './storage.token.js';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [MediaController],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
      useFactory: (config: ConfigService, local: LocalStorageProvider, s3: S3StorageProvider) =>
        config.get<string>('STORAGE_PROVIDER') === 's3' ? s3 : local,
    },
  ],
})
export class MediaModule {}
