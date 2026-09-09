import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CartModule } from '../cart/cart.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';

@Module({
  imports: [AuthModule, CartModule, CouponsModule, PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
