import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { computeSoldTotal } from './sales-stats.util.js';

const includeRelations = {
  images: { orderBy: { position: 'asc' as const } },
  variants: true,
  category: true,
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;

    const where = {
      isActive: true,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // "En Çok Satılan" rozeti için — aynı ürün sayfasındaki simüle "X satıldı"
  // sayısına göre sıralanır ki iki gösterim birbiriyle çelişmesin (bkz.
  // sales-stats.util.ts). Gerçek sipariş verisi biriktikçe burası gerçek
  // satış toplamına göre sıralayacak şekilde güncellenebilir.
  async bestsellers(limit = 25) {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, createdAt: true },
    });
    return products
      .map((p) => ({ id: p.id, soldTotal: computeSoldTotal(p.id, p.createdAt) }))
      .sort((a, b) => b.soldTotal - a.soldTotal)
      .slice(0, limit)
      .map((p, i) => ({ id: p.id, rank: i + 1 }));
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: includeRelations,
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return product;
  }

  async adminFindAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const where = {
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async adminFindOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: includeRelations });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { OR: [{ slug: dto.slug }, { sku: dto.sku }] },
    });
    if (existing) throw new ConflictException('Bu slug veya SKU zaten kullanılıyor');

    const { images, variants, ...data } = dto;
    return this.prisma.product.create({
      data: {
        ...data,
        images: images?.length ? { create: images } : undefined,
        variants: variants?.length ? { create: variants } : undefined,
      },
      include: includeRelations,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.adminFindOne(id);
    const { images, variants, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          images: images?.length ? { create: images } : undefined,
          variants: variants?.length ? { create: variants } : undefined,
        },
        include: includeRelations,
      });
    });
  }

  async remove(id: string) {
    await this.adminFindOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}
