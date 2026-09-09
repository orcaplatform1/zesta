import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { UpdateCouponDto } from './dto/update-coupon.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get('validate')
  async validate(@Query('code') code: string, @Query('subtotal') subtotal: string) {
    const { coupon, discountAmount } = await this.coupons.validate(code, Number(subtotal ?? 0));
    return { code: coupon.code, discountType: coupon.discountType, discountAmount };
  }

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminFindAll() {
    return this.coupons.adminFindAll();
  }

  @Post('admin')
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}
