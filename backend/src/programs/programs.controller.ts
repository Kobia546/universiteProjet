import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';
import { OuvrirNiveauDto } from './dto/ouvrir-niveau.dto';

@Controller('filieres')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  create(@Body() dto: CreateFiliereDto) {
    return this.programsService.createFiliere(dto);
  }

  @Get()
  findAll() {
    return this.programsService.findAllFilieres();
  }

  @Get('niveaux')
  findAllNiveaux() {
    return this.programsService.findAllNiveaux();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programsService.findOneFiliere(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFiliereDto) {
    return this.programsService.updateFiliere(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programsService.removeFiliere(id);
  }

  @Post('ouvrir-niveau')
  ouvrirNiveau(@Body() dto: OuvrirNiveauDto) {
    return this.programsService.ouvrirNiveau(dto);
  }
}
