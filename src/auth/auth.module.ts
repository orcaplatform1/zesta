import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './admin-auth.controller.js';
import { AuthService } from './auth.service.js';
import { CustomerAuthController } from './customer-auth.controller.js';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';
import { CustomerAuthGuard, OptionalCustomerAuthGuard } from './guards/customer-auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as `${number}${'d' | 'h' | 'm' | 's'}`,
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, CustomerAuthController],
  providers: [AuthService, AdminAuthGuard, CustomerAuthGuard, OptionalCustomerAuthGuard],
  exports: [AuthService, AdminAuthGuard, CustomerAuthGuard, OptionalCustomerAuthGuard, JwtModule],
})
export class AuthModule {}
