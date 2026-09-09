import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('track')
  track(@Query('orderNumber') orderNumber: string, @Query('email') email: string) {
    return this.orders.track(orderNumber, email);
  }

  @Get('mine')
  @UseGuards(CustomerAuthGuard)
  findMine(@CurrentCustomer() customer: { sub: string }) {
    return this.orders.findMine(customer.sub);
  }

  @Patch(':id/cancel')
  @UseGuards(CustomerAuthGuard)
  cancel(@Param('id') id: string, @CurrentCustomer() customer: { sub: string }) {
    return this.orders.cancel(id, customer.sub);
  }

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminFindAll() {
    return this.orders.adminFindAll();
  }

  @Get('admin/:id')
  @UseGuards(AdminAuthGuard)
  adminFindOne(@Param('id') id: string) {
    return this.orders.adminFindOne(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto);
  }
}
