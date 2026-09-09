import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { IyzicoProvider } from './providers/iyzico.provider.js';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, IyzicoProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
