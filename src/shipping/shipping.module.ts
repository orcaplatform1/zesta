import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ShippingController } from './shipping.controller.js';
import { ShippingService } from './shipping.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ShippingController],
  providers: [ShippingService],
})
export class ShippingModule {}
