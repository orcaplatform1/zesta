import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdatePageDto } from './dto/update-page.dto.js';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.page.findMany({ orderBy: { slug: 'asc' } });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({ where: { slug } });
    if (!page) throw new NotFoundException('Sayfa bulunamadı');
    return page;
  }

  upsert(slug: string, dto: UpdatePageDto) {
    return this.prisma.page.upsert({
      where: { slug },
      update: dto,
      create: { slug, ...dto },
    });
  }
}
