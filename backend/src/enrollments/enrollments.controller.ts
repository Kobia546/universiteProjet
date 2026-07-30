import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { CreateEcheanceDto } from './dto/create-echeance.dto';
import { UpdateEcheanceDto } from './dto/update-echeance.dto';
import { UpdateDateInscriptionDto } from './dto/update-date-inscription.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inscriptions')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  create(
    @Body() dto: CreateInscriptionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentsService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query('anneeUniversitaireId') anneeUniversitaireId?: string,
    @Query('filiereId') filiereId?: string,
    @Query('statut') statut?: string,
  ) {
    return this.enrollmentsService.findAll({ anneeUniversitaireId, filiereId, statut });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id);
  }

  @Patch(':id/date-inscription')
  modifierDateInscription(
    @Param('id') id: string,
    @Body() dto: UpdateDateInscriptionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentsService.modifierDateInscription(id, dto.dateInscription, user.userId);
  }

  @Post(':id/echeances')
  ajouterEcheance(
    @Param('id') id: string,
    @Body() dto: CreateEcheanceDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentsService.ajouterEcheance(id, dto, user.userId);
  }

  @Patch(':id/echeances/:echeanceId')
  modifierEcheance(
    @Param('id') id: string,
    @Param('echeanceId') echeanceId: string,
    @Body() dto: UpdateEcheanceDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentsService.modifierEcheance(id, echeanceId, dto, user.userId);
  }

  @Delete(':id/echeances/:echeanceId')
  supprimerEcheance(
    @Param('id') id: string,
    @Param('echeanceId') echeanceId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.enrollmentsService.supprimerEcheance(id, echeanceId, user.userId);
  }
}
