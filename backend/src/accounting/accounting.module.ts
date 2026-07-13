import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { NumerotationComptableService } from './numerotation-comptable.service';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, NumerotationComptableService],
  exports: [AccountingService],
})
export class AccountingModule {}
