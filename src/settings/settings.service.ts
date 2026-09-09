import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
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
