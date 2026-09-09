import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../auth/decorators/current-customer.decorator.js';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CustomerAuthGuard } from '../auth/guards/customer-auth.guard.js';
import { AdminCreateReviewDto } from './dto/admin-create-review.dto.js';
import { AdminUpdateReviewDto } from './dto/admin-update-review.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  findForProduct(@Query('productId') productId: string) {
    return this.reviews.findApprovedForProduct(productId);
  }

  // Yorum eklemek icin giris zorunlu — misafir/sahte isim yazamaz, authorName
  // hesabin kayitli adindan otomatik dolduruluyor (bkz. ReviewsService.create).
  @Post()
  @UseGuards(CustomerAuthGuard)
  create(@Body() dto: CreateReviewDto, @CurrentCustomer() customer: { sub: string }) {
    return this.reviews.create(dto, customer.sub);
  }

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminFindAll() {
    return this.reviews.adminFindAll();
  }

  @Post('admin')
  @UseGuards(AdminAuthGuard)
  adminCreate(@Body() dto: AdminCreateReviewDto) {
    return this.reviews.adminCreate(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAuthGuard)
  adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateReviewDto) {
    return this.reviews.adminUpdate(id, dto);
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
