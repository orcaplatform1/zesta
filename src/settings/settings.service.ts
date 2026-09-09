import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Bu prefix'teki key'ler (ör. payment_iyzico -> apiKey/secretKey) ödeme
// sağlayıcı sırlarını düz metin tutar; GET /settings kimlik doğrulaması
// istemeyen public bir endpoint olduğu için buradan asla dönmemeli.
// Admin tarafı zaten maskeli kendi endpoint'ini kullanıyor (/payments/admin/config).
const PRIVATE_KEY_PREFIXES = ['payment_'];

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(
      rows
        .filter((r) => !PRIVATE_KEY_PREFIXES.some((prefix) => r.key.startsWith(prefix)))
        .map((r) => [r.key, r.value]),
    );
  }

  set(key: string, value: unknown) {
    const jsonValue = value as Prisma.InputJsonValue;
    return this.prisma.setting.upsert({
      where: { key },
      update: { value: jsonValue },
      create: { key, value: jsonValue },
    });
  }
}
