import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentRulesService } from './payment-rules.service';
import { CreateReglePaiementDto } from './dto/create-regle-paiement.dto';
import { UpdateReglePaiementDto } from './dto/update-regle-paiement.dto';

@Controller('regles-paiement')
export class PaymentRulesController {
  constructor(private readonly paymentRulesService: PaymentRulesService) {}

  @Post()
  create(@Body() dto: CreateReglePaiementDto) {
    return this.paymentRulesService.create(dto);
  }

  @Get()
  findAll(@Query('anneeUniversitaireId') anneeUniversitaireId?: string) {
    return this.paymentRulesService.findAll(anneeUniversitaireId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReglePaiementDto) {
    return this.paymentRulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentRulesService.remove(id);
  }
}
