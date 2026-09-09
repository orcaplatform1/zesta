import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { UpdateIyzicoConfigDto } from './dto/update-iyzico-config.dto.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Get('admin/config')
  @UseGuards(AdminAuthGuard)
  async getConfig() {
    const config = await this.payments.getIyzicoConfig();
    return {
      apiKey: config?.apiKey ?? '',
      baseUrl: config?.baseUrl ?? 'https://sandbox-api.iyzipay.com',
      enabled: config?.enabled ?? false,
      hasSecretKey: Boolean(config?.secretKey),
    };
  }

  @Put('admin/config')
  @UseGuards(AdminAuthGuard)
  async setConfig(@Body() dto: UpdateIyzicoConfigDto) {
    const saved = await this.payments.setIyzicoConfig(dto);
    return {
      apiKey: saved.apiKey,
      baseUrl: saved.baseUrl,
      enabled: saved.enabled,
      hasSecretKey: Boolean(saved.secretKey),
    };
  }

  // iyzico ödeme sayfası sonrası tarayıcıyı buraya form-post ile geri gönderir.
  @Post('iyzico/callback')
  @HttpCode(302)
  async iyzicoCallback(@Body('token') token: string, @Res() res: Response) {
    const frontendBase = this.config.get<string>('PUBLIC_APP_URL') ?? 'https://zesta.tr';
    try {
      const { success, order } = await this.payments.handleIyzicoCallback(token);
      const target = success
        ? `${frontendBase}/siparis-basarili?orderNumber=${order.orderNumber}&email=${encodeURIComponent(order.email)}`
        : `${frontendBase}/siparis-basarisiz?orderNumber=${order.orderNumber}`;
      return res.redirect(target);
    } catch {
      return res.redirect(`${frontendBase}/siparis-basarisiz`);
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Body() body: { orderId: string; status: 'PAID' | 'FAILED' },
    @Headers('x-webhook-secret') signature: string | undefined,
  ) {
    const expected = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (expected && signature !== expected) throw new ForbiddenException();

    return this.payments.handleWebhook(body.orderId, body.status, body);
  }
}
