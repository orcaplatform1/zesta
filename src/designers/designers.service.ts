import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDesignerApplicationDto } from './dto/create-application.dto.js';
import { CreateDesignerProductDto } from './dto/create-designer-product.dto.js';
import { DesignerLoginDto } from './dto/designer-login.dto.js';
import { RequestPayoutDto } from './dto/request-payout.dto.js';

// Ürün satıldıktan 15 gün sonra, iade edilmediyse ödeme çekilebilir hale gelir
// (bkz. Tasarımcı Panelindeki "Haklarımız" metni).
const PAYOUT_CLEARANCE_DAYS = 15;
// Sipariş verildikten sonra ürünü kargolamak için tanınan süre — geçtiği
// halde sipariş hâlâ PAID/PREPARING ise ihlal sayılır.
const SHIPPING_DEADLINE_DAYS = 7;
const ACTIVE_ORDER_STATUSES = ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] as const;

const includeRelations = {
  images: { orderBy: { position: 'asc' as const } },
  variants: true,
  category: true,
};

@Injectable()
export class DesignersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  // ---------- Başvuru ----------

  async apply(dto: CreateDesignerApplicationDto) {
    const email = dto.email.trim().toLowerCase();
    const [existingApp, existingDesigner] = await Promise.all([
      this.prisma.designerApplication.findUnique({ where: { email } }),
      this.prisma.designer.findUnique({ where: { email } }),
    ]);
    if (existingApp || existingDesigner) throw new ConflictException('Bu e-posta ile zaten bir başvuru var');

    const passwordHash = await this.auth.hashPassword(dto.password);
    const application = await this.prisma.designerApplication.create({
      data: {
        name: dto.name,
        email,
        phone: dto.phone,
        passwordHash,
        category: dto.category,
        otherCategory: dto.otherCategory,
        message: dto.message,
      },
    });
    return { id: application.id };
  }

  adminListApplications() {
    return this.prisma.designerApplication.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async adminApproveApplication(id: string) {
    const application = await this.prisma.designerApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Başvuru bulunamadı');
    if (application.status !== 'PENDING') throw new BadRequestException('Başvuru zaten değerlendirilmiş');

    return this.prisma.$transaction(async (tx) => {
      const designer = await tx.designer.create({
        data: {
          applicationId: application.id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          passwordHash: application.passwordHash,
        },
      });
      await tx.designerApplication.update({
        where: { id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
      return designer;
    });
  }

  async adminRejectApplication(id: string) {
    const application = await this.prisma.designerApplication.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Başvuru bulunamadı');
    if (application.status !== 'PENDING') throw new BadRequestException('Başvuru zaten değerlendirilmiş');
    return this.prisma.designerApplication.update({
      where: { id },
      data: { status: 'REJECTED', reviewedAt: new Date() },
    });
  }

  // ---------- Oturum ----------

  async login(dto: DesignerLoginDto) {
    const designer = await this.prisma.designer.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!designer) throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    const ok = await this.auth.verifyPassword(designer.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    if (!designer.isActive) throw new UnauthorizedException('Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin.');
    return designer;
  }

  async me(designerId: string) {
    const designer = await this.prisma.designer.findUnique({ where: { id: designerId } });
    if (!designer) throw new UnauthorizedException();
    return {
      id: designer.id,
      name: designer.name,
      email: designer.email,
      phone: designer.phone,
      commissionPct: designer.commissionPct,
      isActive: designer.isActive,
      shipViolationCount: designer.shipViolationCount,
    };
  }

  // ---------- Ürünler ----------

  myProducts(designerId: string) {
    return this.prisma.product.findMany({
      where: { designerId },
      include: includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitProduct(designerId: string, dto: CreateDesignerProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Bu slug zaten kullanılıyor');

    const { images, variants, ...data } = dto;
    const sku = `DSG-${designerId.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.product.create({
      data: {
        ...data,
        sku,
        designerId,
        approvalStatus: 'PENDING',
        isActive: false,
        images: images?.length ? { create: images } : undefined,
        variants: variants?.length ? { create: variants } : undefined,
      },
      include: includeRelations,
    });
  }

  // ---------- İstatistik & Bakiye ----------

  async myStats(designerId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { product: { designerId }, order: { status: { in: [...ACTIVE_ORDER_STATUSES] } } },
      include: { order: { select: { createdAt: true, status: true } } },
    });

    const clearanceCutoff = Date.now() - PAYOUT_CLEARANCE_DAYS * 24 * 60 * 60 * 1000;
    let totalSales = 0;
    let eligibleGross = 0;
    let pendingClearanceGross = 0;

    for (const item of items) {
      const amount = Number(item.totalPrice);
      totalSales += amount;
      if (item.order.createdAt.getTime() <= clearanceCutoff) {
        eligibleGross += amount;
      } else {
        pendingClearanceGross += amount;
      }
    }

    const designer = await this.prisma.designer.findUniqueOrThrow({ where: { id: designerId } });
    const commissionPct = designer.commissionPct;
    const eligibleNet = eligibleGross * (1 - commissionPct / 100);

    const payoutAgg = await this.prisma.payoutRequest.groupBy({
      by: ['status'],
      where: { designerId, status: { in: ['PENDING', 'PAID'] } },
      _sum: { amount: true },
    });
    const reserved = payoutAgg.reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0);

    const [productCount, pendingProductCount, orderCount] = await Promise.all([
      this.prisma.product.count({ where: { designerId, approvalStatus: 'APPROVED' } }),
      this.prisma.product.count({ where: { designerId, approvalStatus: 'PENDING' } }),
      this.prisma.orderItem
        .findMany({ where: { product: { designerId } }, distinct: ['orderId'], select: { orderId: true } })
        .then((rows) => rows.length),
    ]);

    return {
      commissionPct,
      totalSalesGross: totalSales,
      eligibleNet,
      pendingClearanceGross,
      availableBalance: Math.max(0, eligibleNet - reserved),
      productCount,
      pendingProductCount,
      orderCount,
    };
  }

  // ---------- Ödeme talepleri ----------

  async requestPayout(designerId: string, dto: RequestPayoutDto) {
    const stats = await this.myStats(designerId);
    if (dto.amount > stats.availableBalance) {
      throw new BadRequestException('Talep edilen tutar çekilebilir bakiyenizden fazla');
    }
    return this.prisma.payoutRequest.create({ data: { designerId, amount: dto.amount } });
  }

  myPayouts(designerId: string) {
    return this.prisma.payoutRequest.findMany({ where: { designerId }, orderBy: { requestedAt: 'desc' } });
  }

  adminListPayouts() {
    return this.prisma.payoutRequest.findMany({
      include: { designer: { select: { name: true, email: true } } },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async adminMarkPayoutPaid(id: string) {
    const payout = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Ödeme talebi bulunamadı');
    return this.prisma.payoutRequest.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
  }

  async adminRejectPayout(id: string) {
    const payout = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!payout) throw new NotFoundException('Ödeme talebi bulunamadı');
    return this.prisma.payoutRequest.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  // ---------- Admin: tasarımcılar & kargo ihlalleri ----------

  adminListDesigners() {
    return this.prisma.designer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async adminSetActive(id: string, isActive: boolean) {
    const designer = await this.prisma.designer.findUnique({ where: { id } });
    if (!designer) throw new NotFoundException('Tasarımcı bulunamadı');
    return this.prisma.designer.update({
      where: { id },
      data: { isActive, shipViolationCount: isActive ? 0 : designer.shipViolationCount },
    });
  }

  // 7 gün içinde kargolanmamış (status hâlâ PAID/PREPARING) siparişleri, hangi
  // tasarımcıya ait olduklarıyla birlikte listeler — otomatik ceza UYGULAMAZ,
  // admin inceleyip "İhlal Say" ile bilinçli olarak işaretler (bkz. modül notu).
  async adminShippingViolations() {
    const deadline = new Date(Date.now() - SHIPPING_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    const items = await this.prisma.orderItem.findMany({
      where: {
        product: { designerId: { not: null } },
        order: { status: { in: ['PAID', 'PREPARING'] }, createdAt: { lt: deadline } },
      },
      include: {
        order: { select: { id: true, orderNumber: true, createdAt: true, status: true } },
        product: { select: { id: true, name: true, designerId: true, designer: { select: { name: true, email: true } } } },
      },
    });

    const byOrder = new Map<string, (typeof items)[number]>();
    for (const item of items) byOrder.set(`${item.orderId}-${item.product.designerId}`, item);

    return Array.from(byOrder.values()).map((item) => ({
      orderId: item.order.id,
      orderNumber: item.order.orderNumber,
      orderCreatedAt: item.order.createdAt,
      designerId: item.product.designerId,
      designerName: item.product.designer?.name,
      designerEmail: item.product.designer?.email,
      productName: item.product.name,
    }));
  }

  async adminFlagViolation(designerId: string) {
    const designer = await this.prisma.designer.findUnique({ where: { id: designerId } });
    if (!designer) throw new NotFoundException('Tasarımcı bulunamadı');
    return this.prisma.designer.update({
      where: { id: designerId },
      data: { shipViolationCount: designer.shipViolationCount + 1 },
    });
  }

  // ---------- Admin: ürün onayı ----------

  adminListPendingProducts() {
    return this.prisma.product.findMany({
      where: { approvalStatus: 'PENDING' },
      include: { ...includeRelations, designer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async adminApproveProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return this.prisma.product.update({ where: { id }, data: { approvalStatus: 'APPROVED', isActive: true } });
  }

  async adminRejectProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return this.prisma.product.update({ where: { id }, data: { approvalStatus: 'REJECTED', isActive: false } });
  }
}
