import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactService, type CreateContactDto } from './contact.service.js';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.contactService.findAll(Number(page), Number(limit));
  }

  @Patch(':id/read')
  @UseGuards(AdminAuthGuard)
  markRead(@Param('id') id: string) {
    return this.contactService.markRead(id);
  }
}
