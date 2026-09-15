import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DesignerApplicationsController } from './designer-applications.controller.js';
import { DesignersController } from './designers.controller.js';
import { DesignersService } from './designers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DesignerApplicationsController, DesignersController],
  providers: [DesignersService],
})
export class DesignersModule {}
