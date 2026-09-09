import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { CheckoutService } from './checkout.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';

// Misafir (üye olmayan) sipariş veremez — checkout üye girişi zorunlu kılınarak korunuyor.
@Controller('checkout')
@UseGuards(CustomerAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post()
  create(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentCustomer() customer: { sub: string },
    @Body() dto: CheckoutDto,
  ) {
    return this.checkout.checkout(req, res, customer.sub, dto);
  }
}
