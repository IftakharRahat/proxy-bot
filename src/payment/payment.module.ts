import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UddoktaPayService } from './uddoktapay.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, UddoktaPayService], // Added UddoktaPayService
  exports: [PaymentService, UddoktaPayService], // Export it too
})
export class PaymentModule { }
