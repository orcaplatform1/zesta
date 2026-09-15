import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard.js';
import { CreateDesignerApplicationDto } from './dto/create-application.dto.js';
import { DesignersService } from './designers.service.js';

@Controller('designer-applications')
export class DesignerApplicationsController {
  constructor(private readonly designers: DesignersService) {}

  @Post()
  apply(@Body() dto: CreateDesignerApplicationDto) {
    return this.designers.apply(dto);
  }

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  adminList() {
    return this.designers.adminListApplications();
  }

  @Patch('admin/:id/approve')
  @UseGuards(AdminAuthGuard)
  adminApprove(@Param('id') id: string) {
    return this.designers.adminApproveApplication(id);
  }

  @Patch('admin/:id/reject')
  @UseGuards(AdminAuthGuard)
  adminReject(@Param('id') id: string) {
    return this.designers.adminRejectApplication(id);
  }
}
