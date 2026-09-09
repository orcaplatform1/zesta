import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminCreateReviewDto } from './dto/admin-create-review.dto.js';
import { AdminUpdateReviewDto } from './dto/admin-update-review.dto.js';
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

  async create(dto: CreateReviewDto, customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException();
    return this.prisma.review.create({
      data: { ...dto, customerId, authorName: customer.name, isApproved: false },
    });
  }

  adminFindAll() {
    return this.prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin panelden dogrudan eklenen yorum — kendi onayladigi icin varsayilan onayli.
  adminCreate(dto: AdminCreateReviewDto) {
    return this.prisma.review.create({
      data: { ...dto, isApproved: dto.isApproved ?? true },
    });
  }

  async adminUpdate(id: string, dto: AdminUpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Yorum bulunamadı');
    return this.prisma.review.update({ where: { id }, data: dto });
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
