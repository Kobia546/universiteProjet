import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { NumeroInscriptionService } from './numero-inscription.service';
import { EcheancesService } from './echeances.service';
import { PaymentRulesModule } from '../payment-rules/payment-rules.module';

@Module({
  imports: [PaymentRulesModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, NumeroInscriptionService, EcheancesService],
  exports: [EcheancesService, EnrollmentsService],
})
export class EnrollmentsModule {}
