import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { OptionalCustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  findForProduct(@Query('productId') productId: string) {
    return this.reviews.findApprovedForProduct(productId);
  }

  @Post()
  @UseGuards(OptionalCustomerAuthGuard)
  create(@Body() dto: CreateReviewDto, @CurrentCustomer() customer?: { sub: string }) {
    return this.reviews.create(dto, customer?.sub);
  }

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminFindAll() {
    return this.reviews.adminFindAll();
  }

  @Patch('admin/:id/approve')
  @UseGuards(AdminAuthGuard)
  approve(@Param('id') id: string) {
    return this.reviews.setApproved(id, true);
  }

  @Patch('admin/:id/reject')
  @UseGuards(AdminAuthGuard)
  reject(@Param('id') id: string) {
    return this.reviews.setApproved(id, false);
  }

  @Delete('admin/:id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.reviews.remove(id);
  }
}
