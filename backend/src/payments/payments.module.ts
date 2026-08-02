import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { CarnetRecuModule } from '../carnet-recu/carnet-recu.module';

@Module({
  imports: [AccountingModule, EnrollmentsModule, CarnetRecuModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
