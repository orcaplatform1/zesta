import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { UpdatePageDto } from './dto/update-page.dto.js';
import { PagesService } from './pages.service.js';

@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get()
  findAll() {
    return this.pages.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.pages.findBySlug(slug);
  }

  @Put('admin/:slug')
  @UseGuards(AdminAuthGuard)
  upsert(@Param('slug') slug: string, @Body() dto: UpdatePageDto) {
    return this.pages.upsert(slug, dto);
  }
}
