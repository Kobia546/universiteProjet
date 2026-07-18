import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { NumeroRecuService } from './numero-recu.service';
import { AccountingModule } from '../accounting/accounting.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [AccountingModule, EnrollmentsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, NumeroRecuService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
