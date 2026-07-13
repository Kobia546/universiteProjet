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
    @Query('filiereId') filiereId?: string,
    @Query('niveauId') niveauId?: string,
  ) {
    return this.studentsService.findAll({ recherche, filiereId, niveauId });
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
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
