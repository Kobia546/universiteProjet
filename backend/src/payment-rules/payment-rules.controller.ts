import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { PaymentRulesService } from './payment-rules.service';
import { CreateReglePaiementDto } from './dto/create-regle-paiement.dto';
import { UpdateReglePaiementDto } from './dto/update-regle-paiement.dto';

@Controller('regles-paiement')
export class PaymentRulesController {
  constructor(private readonly paymentRulesService: PaymentRulesService) {}

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateReglePaiementDto) {
    return this.paymentRulesService.create(dto);
  }

  @Get()
  findAll(@Query('anneeUniversitaireId') anneeUniversitaireId?: string) {
    return this.paymentRulesService.findAll(anneeUniversitaireId);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateReglePaiementDto) {
    return this.paymentRulesService.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string) {
    return this.paymentRulesService.remove(id);
  }
}
