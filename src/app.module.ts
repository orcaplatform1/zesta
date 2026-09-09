import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CartModule } from './cart/cart.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { MediaModule } from './media/media.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PagesModule } from './pages/pages.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { ShippingModule } from './shipping/shipping.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    CouponsModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    ReviewsModule,
    PagesModule,
    SettingsModule,
    MediaModule,
    AdminModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
