import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { CustomersService } from './customers.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpsertAddressDto } from './dto/upsert-address.dto.js';

@Controller('customers/me')
@UseGuards(CustomerAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Patch('profile')
  updateProfile(@CurrentCustomer() customer: { sub: string }, @Body() dto: UpdateProfileDto) {
    return this.customers.updateProfile(customer.sub, dto);
  }

  @Patch('password')
  changePassword(@CurrentCustomer() customer: { sub: string }, @Body() dto: ChangePasswordDto) {
    return this.customers.changePassword(customer.sub, dto);
  }

  @Get('addresses')
  listAddresses(@CurrentCustomer() customer: { sub: string }) {
    return this.customers.listAddresses(customer.sub);
  }

  @Post('addresses')
  addAddress(@CurrentCustomer() customer: { sub: string }, @Body() dto: UpsertAddressDto) {
    return this.customers.addAddress(customer.sub, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentCustomer() customer: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.customers.updateAddress(customer.sub, id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentCustomer() customer: { sub: string }, @Param('id') id: string) {
    return this.customers.removeAddress(customer.sub, id);
  }
}
