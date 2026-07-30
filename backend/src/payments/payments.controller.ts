import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('paiements')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaiementDto, @CurrentUser() user: { userId: string }) {
    return this.paymentsService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('etudiantId') etudiantId?: string,
    @Query('inscriptionId') inscriptionId?: string,
    @Query('modePaiement') modePaiement?: string,
    @Query('anneeUniversitaireId') anneeUniversitaireId?: string,
  ) {
    return this.paymentsService.findAll({ etudiantId, inscriptionId, modePaiement, anneeUniversitaireId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/annuler')
  annuler(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.paymentsService.annuler(id, user.userId);
  }
}
