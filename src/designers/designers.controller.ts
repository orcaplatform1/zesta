import { Body, Controller, Get, HttpCode, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { CurrentDesigner } from '../auth/decorators/current-designer.decorator.js';
import { DesignerAuthGuard } from '../auth/guards/designer-auth.guard.js';
import { CreateDesignerProductDto } from './dto/create-designer-product.dto.js';
import { DesignerLoginDto } from './dto/designer-login.dto.js';
import { RequestPayoutDto } from './dto/request-payout.dto.js';
import { DesignersService } from './designers.service.js';

@Controller('designers')
export class DesignersController {
  constructor(
    private readonly designers: DesignersService,
    private readonly auth: AuthService,
  ) {}

  // ---------- Oturum ----------

  // Global throttle (120 istek/dk) brute-force için fazla gevşek — tasarımcı
  // girişine özel dakikada 5 deneme sınırı.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: DesignerLoginDto, @Res({ passthrough: true }) res: Response) {
    const designer = await this.designers.login(dto);
    const token = await this.auth.sign({ sub: designer.id, type: 'designer' });
    this.auth.setDesignerCookie(res, token);
    return { id: designer.id, name: designer.name, email: designer.email };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearDesignerCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(DesignerAuthGuard)
  me(@CurrentDesigner() designer: { sub: string }) {
    return this.designers.me(designer.sub);
  }

  @Get('me/stats')
  @UseGuards(DesignerAuthGuard)
  myStats(@CurrentDesigner() designer: { sub: string }) {
    return this.designers.myStats(designer.sub);
  }

  // ---------- Ürünler ----------

  @Get('me/products')
  @UseGuards(DesignerAuthGuard)
  myProducts(@CurrentDesigner() designer: { sub: string }) {
    return this.designers.myProducts(designer.sub);
  }

  @Post('me/products')
  @UseGuards(DesignerAuthGuard)
  submitProduct(@CurrentDesigner() designer: { sub: string }, @Body() dto: CreateDesignerProductDto) {
    return this.designers.submitProduct(designer.sub, dto);
  }

  // ---------- Ödeme talepleri ----------

  @Get('me/payouts')
  @UseGuards(DesignerAuthGuard)
  myPayouts(@CurrentDesigner() designer: { sub: string }) {
    return this.designers.myPayouts(designer.sub);
  }

  @Post('me/payouts')
  @UseGuards(DesignerAuthGuard)
  requestPayout(@CurrentDesigner() designer: { sub: string }, @Body() dto: RequestPayoutDto) {
    return this.designers.requestPayout(designer.sub, dto);
  }

  // ---------- Admin: tasarımcılar ----------

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminList() {
    return this.designers.adminListDesigners();
  }

  @Patch('admin/:id/suspend')
  @UseGuards(AdminAuthGuard)
  adminSuspend(@Param('id') id: string) {
    return this.designers.adminSetActive(id, false);
  }

  @Patch('admin/:id/reactivate')
  @UseGuards(AdminAuthGuard)
  adminReactivate(@Param('id') id: string) {
    return this.designers.adminSetActive(id, true);
  }

  @Patch('admin/:id/flag-violation')
  @UseGuards(AdminAuthGuard)
  adminFlagViolation(@Param('id') id: string) {
    return this.designers.adminFlagViolation(id);
  }

  @Get('admin/shipping-violations')
  @UseGuards(AdminAuthGuard)
  adminShippingViolations() {
    return this.designers.adminShippingViolations();
  }

  // ---------- Admin: ürün onayı ----------

  @Get('admin/pending-products')
  @UseGuards(AdminAuthGuard)
  adminPendingProducts() {
    return this.designers.adminListPendingProducts();
  }

  @Patch('admin/pending-products/:id/approve')
  @UseGuards(AdminAuthGuard)
  adminApproveProduct(@Param('id') id: string) {
    return this.designers.adminApproveProduct(id);
  }

  @Patch('admin/pending-products/:id/reject')
  @UseGuards(AdminAuthGuard)
  adminRejectProduct(@Param('id') id: string) {
    return this.designers.adminRejectProduct(id);
  }

  // ---------- Admin: ödeme talepleri ----------

  @Get('admin/payouts')
  @UseGuards(AdminAuthGuard)
  adminListPayouts() {
    return this.designers.adminListPayouts();
  }

  @Patch('admin/payouts/:id/paid')
  @UseGuards(AdminAuthGuard)
  adminMarkPayoutPaid(@Param('id') id: string) {
    return this.designers.adminMarkPayoutPaid(id);
  }

  @Patch('admin/payouts/:id/reject')
  @UseGuards(AdminAuthGuard)
  adminRejectPayout(@Param('id') id: string) {
    return this.designers.adminRejectPayout(id);
  }
}
