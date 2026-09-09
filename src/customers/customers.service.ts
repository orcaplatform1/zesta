import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpsertAddressDto } from './dto/upsert-address.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async updateProfile(customerId: string, dto: UpdateProfileDto) {
    const email = dto.email ? dto.email.trim().toLowerCase() : undefined;
    if (email) {
      const existing = await this.prisma.customer.findUnique({ where: { email } });
      if (existing && existing.id !== customerId) throw new ConflictException('Bu e-posta zaten kayıtlı');
    }
    const { birthDate, ...rest } = dto;
    return this.prisma.customer.update({
      where: { id: customerId },
      data: { ...rest, email, birthDate: birthDate ? new Date(birthDate) : undefined },
      select: { id: true, email: true, name: true, phone: true, birthDate: true },
    });
  }

  async changePassword(customerId: string, dto: ChangePasswordDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.passwordHash) throw new NotFoundException('Hesap bulunamadı');

    const ok = await this.auth.verifyPassword(customer.passwordHash, dto.currentPassword);
    if (!ok) throw new UnauthorizedException('Mevcut şifre hatalı');

    const passwordHash = await this.auth.hashPassword(dto.newPassword);
    await this.prisma.customer.update({ where: { id: customerId }, data: { passwordHash } });
    return { ok: true };
  }

  listAddresses(customerId: string) {
    return this.prisma.address.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } });
  }

  async addAddress(customerId: string, dto: UpsertAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({ data: { ...dto, customerId } });
  }

  async updateAddress(customerId: string, addressId: string, dto: UpsertAddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.customerId !== customerId) throw new NotFoundException('Adres bulunamadı');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { customerId }, data: { isDefault: false } });
    }
    return this.prisma.address.update({ where: { id: addressId }, data: dto });
  }

  async removeAddress(customerId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.customerId !== customerId) throw new ForbiddenException();
    await this.prisma.address.delete({ where: { id: addressId } });
    return { ok: true };
  }
}
