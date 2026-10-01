import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import { UpdateEtudiantDto } from './dto/update-etudiant.dto';

@Controller('etudiants')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Body() dto: CreateEtudiantDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  findAll(
    @Query('recherche') recherche?: string,
    @Query('niveauId') niveauId?: string,
    @Query('filiereId') filiereId?: string,
    @Query('anneeUniversitaireId') anneeUniversitaireId?: string,
  ) {
    return this.studentsService.findAll({ recherche, niveauId, filiereId, anneeUniversitaireId });
  }

  // Déclaré AVANT ':id' pour ne pas être intercepté par la route générique
  @Get('statut-paiement')
  findParStatutPaiement(
    @Query('statut') statut: 'doit' | 'solde',
    @Query('anneeUniversitaireId') anneeUniversitaireId?: string,
    @Query('niveauId') niveauId?: string,
    @Query('filiereId') filiereId?: string,
  ) {
    return this.studentsService.findParStatutPaiement(
      statut === 'solde' ? 'solde' : 'doit',
      anneeUniversitaireId,
      niveauId,
      filiereId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEtudiantDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.studentsService.remove(id, user.userId);
  }
}
