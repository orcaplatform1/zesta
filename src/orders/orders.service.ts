import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

const orderInclude = {
  items: true,
  payment: true,
  shipment: true,
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async track(orderNumber: string, email: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
    if (!order || order.email.toLowerCase() !== email.toLowerCase()) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return order;
  }

  findMine(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  adminFindAll() {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminFindOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    await this.adminFindOne(id);
    return this.prisma.order.update({ where: { id }, data: { status: dto.status } });
  }

  async cancel(id: string, customerId: string) {
    const order = await this.adminFindOne(id);
    if (order.customerId !== customerId) throw new ForbiddenException();
    if (order.status !== 'PENDING') throw new ForbiddenException('Bu sipariş artık iptal edilemez');
    return this.prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
