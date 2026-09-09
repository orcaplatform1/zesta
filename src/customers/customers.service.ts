import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpsertAddressDto } from './dto/upsert-address.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(customerId: string, dto: UpdateProfileDto) {
    return this.prisma.customer.update({ where: { id: customerId }, data: dto });
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
