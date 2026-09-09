import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { CurrentCustomer } from './decorators/current-customer.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterCustomerDto } from './dto/register-customer.dto.js';
import { CustomerAuthGuard } from './guards/customer-auth.guard.js';

@Controller('auth')
export class CustomerAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterCustomerDto, @Res({ passthrough: true }) res: Response) {
    // E-posta büyük-küçük harfe duyarsız — hem kontrol hem kayıt küçük harfle yapılır.
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const passwordHash = await this.auth.hashPassword(dto.password);
    const customer = await this.prisma.customer.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    });

    const token = await this.auth.sign({ sub: customer.id, type: 'customer' });
    this.auth.setCustomerCookie(res, token);

    return { id: customer.id, email: customer.email, name: customer.name };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const customer = await this.prisma.customer.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!customer || !customer.passwordHash) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const ok = await this.auth.verifyPassword(customer.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const token = await this.auth.sign({ sub: customer.id, type: 'customer' });
    this.auth.setCustomerCookie(res, token);

    return { id: customer.id, email: customer.email, name: customer.name };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearCustomerCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  async me(@CurrentCustomer() customer: { sub: string }) {
    const record = await this.prisma.customer.findUnique({ where: { id: customer.sub } });
    if (!record) throw new UnauthorizedException();
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      phone: record.phone,
      birthDate: record.birthDate,
    };
  }
}
