import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { OuvrirFiliereDto } from './dto/ouvrir-filiere.dto';
import { RattacherMatiereDto } from './dto/rattacher-matiere.dto';

@Controller('filieres')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAllFilieres();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOneFiliere(id);
  }

  @Post('ouvrir')
  ouvrir(@Body() dto: OuvrirFiliereDto) {
    return this.programsService.ouvrirFiliere(dto);
  }

  @Patch(':id/fermer')
  fermer(@Param('id') id: string) {
    return this.programsService.fermerFiliere(id);
  }

  @Post('matieres/rattacher')
  rattacherMatiere(@Body() dto: RattacherMatiereDto) {
    return this.programsService.rattacherMatiere(dto);
  }

  @Delete('matieres/rattachement/:id')
  detacherMatiere(@Param('id') id: string) {
    return this.programsService.detacherMatiere(id);
  }
}

@Controller('matieres')
export class MatieresController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() dto: CreateMatiereDto) {
    return this.programsService.createMatiere(dto);
  }

  @Get()
  findAll() {
    return this.programsService.findAllMatieres();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMatiereDto) {
    return this.programsService.updateMatiere(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeMatiere(id);
  }
}
