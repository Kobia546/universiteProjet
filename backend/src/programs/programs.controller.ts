import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProgramsService } from './programs.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { OuvrirNiveauDto } from './dto/ouvrir-niveau.dto';
import { RattacherMatiereDto } from './dto/rattacher-matiere.dto';

type Agent = { userId: string };

// Lecture ouverte à tout utilisateur connecté (listes déroulantes, filtres) ;
// écriture réservée au module ADMINISTRATION.

@Controller('niveaux')
export class NiveauxController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAllNiveaux();
  }

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateNiveauDto, @CurrentUser() user: Agent) {
    return this.programsService.createNiveau(dto, user.userId);
  }

  @Post('ouvrir')
  @RequireModule(ModuleCode.ADMINISTRATION)
  ouvrir(@Body() dto: OuvrirNiveauDto) {
    return this.programsService.ouvrirNiveau(dto);
  }

  @Patch('ouvertures/:id/fermer')
  @RequireModule(ModuleCode.ADMINISTRATION)
  fermer(@Param('id') id: string) {
    return this.programsService.fermerOuverture(id);
  }

  @Post('matieres/rattacher')
  @RequireModule(ModuleCode.ADMINISTRATION)
  rattacherMatiere(@Body() dto: RattacherMatiereDto) {
    return this.programsService.rattacherMatiere(dto);
  }

  @Delete('matieres/rattachement/:id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  detacherMatiere(@Param('id') id: string) {
    return this.programsService.detacherMatiere(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOneNiveau(id);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateNiveauDto, @CurrentUser() user: Agent) {
    return this.programsService.updateNiveau(id, dto, user.userId);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string, @CurrentUser() user: Agent) {
    return this.programsService.removeNiveau(id, user.userId);
  }
}

@Controller('filieres')
export class FilieresController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll(@Query('actifsSeulement') actifsSeulement?: string) {
    return this.programsService.findAllFilieres(actifsSeulement === 'true');
  }

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateFiliereDto, @CurrentUser() user: Agent) {
    return this.programsService.createFiliere(dto, user.userId);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateFiliereDto, @CurrentUser() user: Agent) {
    return this.programsService.updateFiliere(id, dto, user.userId);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string, @CurrentUser() user: Agent) {
    return this.programsService.removeFiliere(id, user.userId);
  }
}

@Controller('matieres')
export class MatieresController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAllMatieres();
  }

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateMatiereDto) {
    return this.programsService.createMatiere(dto);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateMatiereDto) {
    return this.programsService.updateMatiere(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string) {
    return this.programsService.removeMatiere(id);
  }
}
