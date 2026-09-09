import { Body, Controller, Get, HttpCode, Post, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { CurrentAdmin } from './decorators/current-admin.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { AdminAuthGuard } from './guards/admin-auth.guard.js';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const ok = await this.auth.verifyPassword(admin.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Geçersiz kimlik bilgileri');

    const token = await this.auth.sign({ sub: admin.id, type: 'admin', role: admin.role });
    this.auth.setAdminCookie(res, token);

    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearAdminCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(@CurrentAdmin() admin: { sub: string }) {
    const record = await this.prisma.adminUser.findUnique({ where: { id: admin.sub } });
    if (!record) throw new UnauthorizedException();
    return { id: record.id, email: record.email, name: record.name, role: record.role };
  }
}
