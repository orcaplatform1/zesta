import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll() {
    return this.categories.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.categories.findBySlug(slug);
  }

  @Post('admin')
  @UseGuards(AdminAuthGuard)
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
