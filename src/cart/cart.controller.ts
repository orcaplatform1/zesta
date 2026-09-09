import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { OptionalCustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

@Controller('cart')
@UseGuards(OptionalCustomerAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentCustomer() customer?: { sub: string }) {
    return this.cart.getCartSummary(req, res, customer?.sub);
  }

  @Post('items')
  addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentCustomer() customer: { sub: string } | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.addItem(req, res, customer?.sub, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentCustomer() customer: { sub: string } | undefined,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.updateItem(req, res, customer?.sub, itemId, dto);
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentCustomer() customer: { sub: string } | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cart.removeItem(req, res, customer?.sub, itemId);
  }

  @Delete()
  clear(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentCustomer() customer?: { sub: string }) {
    return this.cart.clear(req, res, customer?.sub);
  }
}
