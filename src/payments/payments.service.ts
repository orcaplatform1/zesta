import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IyzicoConfig, IyzicoProvider } from './providers/iyzico.provider.js';

const IYZICO_SETTING_KEY = 'payment_iyzico';

export interface CheckoutContext {
  ip: string;
  identityNumber?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly iyzico: IyzicoProvider,
  ) {}

  async getIyzicoConfig(): Promise<IyzicoConfig | null> {
    const row = await this.prisma.setting.findUnique({ where: { key: IYZICO_SETTING_KEY } });
    if (!row) return null;
    return row.value as unknown as IyzicoConfig;
  }

  async setIyzicoConfig(patch: Partial<IyzicoConfig>) {
    const current = await this.getIyzicoConfig();
    const next: IyzicoConfig = {
      apiKey: patch.apiKey ?? current?.apiKey ?? '',
      secretKey: patch.secretKey || current?.secretKey || '',
      baseUrl: patch.baseUrl ?? current?.baseUrl ?? 'https://sandbox-api.iyzipay.com',
      enabled: patch.enabled ?? current?.enabled ?? false,
    };
    await this.prisma.setting.upsert({
      where: { key: IYZICO_SETTING_KEY },
      update: { value: next as unknown as Prisma.InputJsonValue },
      create: { key: IYZICO_SETTING_KEY, value: next as unknown as Prisma.InputJsonValue },
    });
    return next;
  }

  async initiate(orderId: string, context: CheckoutContext) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const iyzicoConfig = await this.getIyzicoConfig();
    const active = Boolean(iyzicoConfig?.enabled && iyzicoConfig.apiKey && iyzicoConfig.secretKey);

    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      update: { provider: active ? 'iyzico' : 'none', amount: order.total },
      create: { orderId, provider: active ? 'iyzico' : 'none', amount: order.total, status: 'PENDING' },
    });

    if (!active) {
      this.logger.warn(`Ödeme sağlayıcısı yapılandırılmadı — sipariş ${order.orderNumber} ödeme adımında bekliyor.`);
      return { configured: false, payment, checkoutUrl: null as string | null };
    }

    if (!context.identityNumber) {
      throw new BadRequestException('TC Kimlik No gerekli');
    }

    const publicAppUrl = this.config.get<string>('PUBLIC_APP_URL') ?? 'https://zesta.tr';
    const [firstName, ...restName] = order.fullName.trim().split(' ');
    const surname = restName.join(' ') || firstName;

    const result = await this.iyzico.initializeCheckoutForm(iyzicoConfig as IyzicoConfig, {
      conversationId: order.id,
      basketId: order.id,
      price: Number(order.total),
      currency: 'TRY',
      callbackUrl: `${publicAppUrl}/api/payments/iyzico/callback`,
      buyer: {
        id: order.customerId ?? order.id,
        name: firstName,
        surname,
        identityNumber: context.identityNumber,
        email: order.email,
        gsmNumber: order.phone,
        registrationAddress: order.addressLine,
        city: order.city,
        country: 'Turkey',
        zipCode: order.postalCode || '00000',
        ip: context.ip,
      },
      address: {
        contactName: order.fullName,
        address: order.addressLine,
        city: order.city,
        country: 'Turkey',
        zipCode: order.postalCode || '00000',
      },
      basketItems: order.items.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: Number(item.totalPrice),
      })),
    });

    if (result.status !== 'success' || !result.paymentPageUrl) {
      throw new BadRequestException(result.errorMessage ?? 'Ödeme başlatılamadı');
    }

    await this.prisma.payment.update({ where: { orderId }, data: { providerPaymentId: result.token } });

    return { configured: true, payment, checkoutUrl: result.paymentPageUrl };
  }

  async handleIyzicoCallback(token: string) {
    const iyzicoConfig = await this.getIyzicoConfig();
    if (!iyzicoConfig) throw new NotFoundException('Ödeme sağlayıcısı yapılandırılmadı');

    const result = await this.iyzico.retrieveCheckoutForm(iyzicoConfig, token);
    const orderId = result.basketId;
    if (!orderId) throw new NotFoundException('Sipariş referansı bulunamadı');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const success = result.status === 'success' && result.paymentStatus === 'SUCCESS';

    await this.prisma.payment.update({
      where: { orderId },
      data: { status: success ? 'PAID' : 'FAILED', rawPayload: result.raw as Prisma.InputJsonValue },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: success ? 'PAID' : 'FAILED', status: success ? 'PAID' : order.status },
    });

    return { success, order };
  }

  // Diğer sağlayıcılar (gelecekte) için genel webhook girişi.
  async handleWebhook(orderId: string, status: 'PAID' | 'FAILED', rawPayload: Prisma.InputJsonValue) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Ödeme kaydı bulunamadı');

    await this.prisma.payment.update({ where: { orderId }, data: { status, rawPayload } });
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status, status: status === 'PAID' ? 'PAID' : 'CANCELLED' },
    });

    return { ok: true };
  }
}
