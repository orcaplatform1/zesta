import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ShippingService } from './shipping.service.js';

@Controller('shipping/admin')
@UseGuards(AdminAuthGuard)
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Patch(':orderId/ship')
  ship(@Param('orderId') orderId: string, @Body() dto: CreateShipmentDto) {
    return this.shipping.ship(orderId, dto);
  }

  @Patch(':orderId/delivered')
  markDelivered(@Param('orderId') orderId: string) {
    return this.shipping.markDelivered(orderId);
  }
}
