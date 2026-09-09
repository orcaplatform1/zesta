import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Ödeme sağlayıcısı (iyzico/PayTR vb.) henüz seçilmedi/API anahtarları girilmedi.
// PAYMENT_PROVIDER .env'de tanımlanana kadar bu servis sadece Payment kaydını
// PENDING olarak açar; gerçek "ödeme başlat" çağrısı sağlayıcı seçilince buraya eklenecek.
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  isConfigured() {
    return Boolean(this.config.get<string>('PAYMENT_PROVIDER'));
  }

  async initiate(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const provider = this.config.get<string>('PAYMENT_PROVIDER') || 'none';

    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      update: { provider, amount: order.total },
      create: { orderId, provider, amount: order.total, status: 'PENDING' },
    });

    if (!this.isConfigured()) {
      this.logger.warn(`Ödeme sağlayıcısı yapılandırılmadı — sipariş ${order.orderNumber} ödeme adımında bekliyor.`);
      return { configured: false, payment, checkoutUrl: null as string | null };
    }

    // TODO: gerçek sağlayıcı entegrasyonu (checkout formu/URL oluşturma) burada yapılacak.
    return { configured: true, payment, checkoutUrl: null as string | null };
  }

  // Sağlayıcı seçilince: imza doğrulama + payload'dan orderId/durum çıkarımı burada güncellenecek.
  async handleWebhook(orderId: string, status: 'PAID' | 'FAILED', rawPayload: Prisma.InputJsonValue) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Ödeme kaydı bulunamadı');

    await this.prisma.payment.update({
      where: { orderId },
      data: { status, rawPayload },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
        status: status === 'PAID' ? 'PAID' : 'CANCELLED',
      },
    });

    return { ok: true };
  }
}
