import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findApprovedForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateReviewDto, customerId?: string) {
    return this.prisma.review.create({
      data: { ...dto, customerId, isApproved: false },
    });
  }

  adminFindAll() {
    return this.prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setApproved(id: string, isApproved: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Yorum bulunamadı');
    return this.prisma.review.update({ where: { id }, data: { isApproved } });
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Yorum bulunamadı');
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }
}
