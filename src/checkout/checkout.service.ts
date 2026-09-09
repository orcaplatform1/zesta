import { BadRequestException, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CartService } from '../cart/cart.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckoutDto } from './dto/checkout.dto.js';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly coupons: CouponsService,
    private readonly payments: PaymentsService,
  ) {}

  async checkout(req: Request, res: Response, customerId: string | undefined, dto: CheckoutDto) {
    const cart = await this.cartService.getOrCreateCart(req, res, customerId);
    if (cart.items.length === 0) throw new BadRequestException('Sepet boş');

    for (const item of cart.items) {
      const availableStock = item.variant?.stock ?? item.product.stock;
      if (availableStock !== null && availableStock < item.quantity) {
        throw new BadRequestException(`"${item.product.name}" için yeterli stok yok`);
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

    let discountTotal = 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const { coupon, discountAmount } = await this.coupons.validate(dto.couponCode, subtotal);
      discountTotal = discountAmount;
      couponId = coupon.id;
    }

    const shippingCost = 0; // kargo entegrasyonu sonraki aşama — bkz. mimari.pdf bölüm 7
    const total = Math.max(subtotal - discountTotal + shippingCost, 0);

    const [{ nextval }] = await this.prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('order_number_seq')`;
    const orderNumber = `ORD-${nextval}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          email: dto.email,
          phone: dto.phone,
          fullName: dto.fullName,
          city: dto.city,
          district: dto.district,
          postalCode: dto.postalCode,
          addressLine: dto.addressLine,
          subtotal,
          shippingCost,
          discountTotal,
          total,
          couponId,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: Number(item.unitPrice) * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Varyantın kendi stoğu varsa (null değilse) ondan düş, yoksa ürünün genel stoğundan
      // düş — availability kontrolüyle aynı fallback mantığı (bkz. yukarısı ve CartService).
      for (const item of cart.items) {
        if (item.variantId && item.variant?.stock !== null && item.variant?.stock !== undefined) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }
      }

      if (couponId) {
        await tx.couponUsage.create({ data: { couponId, orderId: created.id, customerId } });
      }

      return created;
    });

    let payment: Awaited<ReturnType<PaymentsService['initiate']>>;
    try {
      payment = await this.payments.initiate(order.id, {
        ip: req.ip ?? '127.0.0.1',
        identityNumber: dto.identityNumber,
      });
    } catch (err) {
      // Ödeme başlatılamadı (ör. yanlış iyzico anahtarı) — siparişi ve stok düşümünü
      // geri al ki müşterinin sepeti bozulmasın, tekrar deneyebilsin.
      await this.rollbackOrder(order.id, cart.items, couponId);
      throw err;
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { order, payment };
  }

  private async rollbackOrder(
    orderId: string,
    items: { productId: string; variantId: string | null; quantity: number; variant: { stock: number | null } | null }[],
    couponId: string | undefined,
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.variantId && item.variant?.stock !== null && item.variant?.stock !== undefined) {
          await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      }
      if (couponId) {
        await tx.couponUsage.deleteMany({ where: { orderId } });
      }
      await tx.order.delete({ where: { id: orderId } });
    });
  }
}
