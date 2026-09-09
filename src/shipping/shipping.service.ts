import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  async ship(orderId: string, dto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const shipment = await this.prisma.shipment.upsert({
      where: { orderId },
      update: { carrier: dto.carrier, trackingNumber: dto.trackingNumber, shippedAt: new Date() },
      create: { orderId, carrier: dto.carrier, trackingNumber: dto.trackingNumber, shippedAt: new Date() },
    });

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'SHIPPED' } });
    return shipment;
  }

  async markDelivered(orderId: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment) throw new NotFoundException('Kargo kaydı bulunamadı');

    await this.prisma.shipment.update({ where: { orderId }, data: { deliveredAt: new Date() } });
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
    return { ok: true };
  }
}
