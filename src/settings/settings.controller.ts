import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll();
  }

  @Put('admin/:key')
  @UseGuards(AdminAuthGuard)
  set(@Param('key') key: string, @Body('value') value: unknown) {
    return this.settings.set(key, value);
  }
}
