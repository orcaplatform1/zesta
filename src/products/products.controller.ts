import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.products.findAll(query);
  }

  @Get('admin/list')
  @UseGuards(AdminAuthGuard)
  adminFindAll() {
    return this.products.adminFindAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }

  @Post('admin')
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
