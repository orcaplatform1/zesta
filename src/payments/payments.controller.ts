import { Body, Controller, ForbiddenException, Headers, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service.js';

// Sağlayıcı seçildiğinde webhook payload şekli ve imza header adı buna göre güncellenecek.
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

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
