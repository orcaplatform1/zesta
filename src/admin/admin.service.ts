import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, totalOrders, lowStockProducts, recentOrders, paidOrders, todayPaidOrders] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.order.count(),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, orderNumber: true, fullName: true, total: true, status: true, createdAt: true },
      }),
      this.prisma.order.findMany({ where: { paymentStatus: 'PAID' }, select: { total: true } }),
      this.prisma.order.findMany({
        where: { paymentStatus: 'PAID', createdAt: { gte: startOfDay } },
        select: { total: true },
      }),
    ]);

    const sum = (rows: { total: unknown }[]) => rows.reduce((acc, r) => acc + Number(r.total), 0);

    return {
      todaySales: sum(todayPaidOrders),
      todayOrders,
      totalSales: sum(paidOrders),
      totalOrders,
      lowStockProducts,
      recentOrders,
    };
  }
}
