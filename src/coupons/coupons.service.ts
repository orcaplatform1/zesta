import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, cartSubtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new NotFoundException('Kupon geçersiz');

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) throw new BadRequestException('Kupon henüz başlamadı');
    if (coupon.endsAt && now > coupon.endsAt) throw new BadRequestException('Kuponun süresi doldu');
    if (coupon.minCartAmount && cartSubtotal < Number(coupon.minCartAmount)) {
      throw new BadRequestException(`Bu kupon için minimum sepet tutarı ${coupon.minCartAmount} TL`);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = (cartSubtotal * Number(coupon.discountValue)) / 100;
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Number(coupon.discountValue);
    }

    return { coupon, discountAmount: Math.min(discountAmount, cartSubtotal) };
  }

  adminFindAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('Bu kupon kodu zaten var');

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue ?? 0,
        minCartAmount: dto.minCartAmount,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Kupon bulunamadı');
    return this.prisma.coupon.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Kupon bulunamadı');
    await this.prisma.coupon.delete({ where: { id } });
    return { ok: true };
  }
}
