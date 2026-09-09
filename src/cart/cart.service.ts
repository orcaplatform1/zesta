import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

export const CART_COOKIE = 'zesta_cart_token';

const cartInclude = {
  items: {
    include: { product: { include: { images: true } }, variant: true },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(req: Request, res: Response, customerId?: string) {
    let token = req.cookies?.[CART_COOKIE];
    let cart = token ? await this.prisma.cart.findUnique({ where: { sessionToken: token }, include: cartInclude }) : null;

    if (!cart) {
      token = randomBytes(24).toString('hex');
      cart = await this.prisma.cart.create({
        data: { sessionToken: token, customerId },
        include: cartInclude,
      });
      res.cookie(CART_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      // Aynı istek içinde getOrCreateCart tekrar çağrılırsa (ör. addItem sonrası özet
      // dönerken) req.cookies henüz yeni cookie'yi görmez — burada elle senkronize ediyoruz.
      if (req.cookies) req.cookies[CART_COOKIE] = token;
    } else if (customerId && cart.customerId !== customerId) {
      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { customerId },
        include: cartInclude,
      });
    }

    return cart;
  }

  toSummary(cart: Awaited<ReturnType<CartService['getOrCreateCart']>>) {
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: Number(item.unitPrice) * item.quantity,
      product: {
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0]?.url ?? null,
      },
      variant: item.variant ? { name: item.variant.name, value: item.variant.value } : null,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return { id: cart.id, items, subtotal };
  }

  async addItem(req: Request, res: Response, customerId: string | undefined, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(req, res, customerId);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });
    if (!product || !product.isActive) throw new NotFoundException('Ürün bulunamadı');

    const variant = dto.variantId ? product.variants.find((v) => v.id === dto.variantId) : undefined;
    if (dto.variantId && !variant) throw new NotFoundException('Varyant bulunamadı');

    const availableStock = variant?.stock ?? product.stock;
    if (availableStock !== null && availableStock < dto.quantity) {
      throw new BadRequestException('Yetersiz stok');
    }

    const unitPrice = Number(product.salePrice ?? product.price) + Number(variant?.priceDelta ?? 0);

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: dto.productId, variantId: dto.variantId ?? null },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
          unitPrice,
        },
      });
    }

    return this.getCartSummary(req, res, customerId);
  }

  async updateItem(req: Request, res: Response, customerId: string | undefined, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(req, res, customerId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Sepet ürünü bulunamadı');

    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.getCartSummary(req, res, customerId);
  }

  async removeItem(req: Request, res: Response, customerId: string | undefined, itemId: string) {
    const cart = await this.getOrCreateCart(req, res, customerId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Sepet ürünü bulunamadı');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCartSummary(req, res, customerId);
  }

  async clear(req: Request, res: Response, customerId: string | undefined) {
    const cart = await this.getOrCreateCart(req, res, customerId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCartSummary(req, res, customerId);
  }

  async getCartSummary(req: Request, res: Response, customerId: string | undefined) {
    const cart = await this.getOrCreateCart(req, res, customerId);
    return this.toSummary(cart);
  }
}
