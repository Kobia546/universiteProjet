import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { UpdateAnneeDto } from './dto/update-annee.dto';
import { AcademicYearsService } from './academic-years.service';
import { CreateAnneeDto } from './dto/create-annee.dto';

@Controller('annees-universitaires')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateAnneeDto) {
    return this.academicYearsService.create(dto);
  }

  @Get()
  findAll() {
    return this.academicYearsService.findAll();
  }

  @Patch(':id/activer')
  @RequireModule(ModuleCode.ADMINISTRATION)
  activer(@Param('id') id: string) {
    return this.academicYearsService.activer(id);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateAnneeDto) {
    return this.academicYearsService.update(id, dto);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string) {
    return this.academicYearsService.remove(id);
  }
}
