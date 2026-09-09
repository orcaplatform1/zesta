import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  dashboard() {
    return this.admin.dashboard();
  }
}
