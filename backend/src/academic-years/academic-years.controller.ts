import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAnneeDto } from './dto/create-annee.dto';

@Controller('annees-universitaires')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Post()
  create(@Body() dto: CreateAnneeDto) {
    return this.academicYearsService.create(dto);
  }

  @Get()
  findAll() {
    return this.academicYearsService.findAll();
  }

  @Patch(':id/activer')
  activer(@Param('id') id: string) {
    return this.academicYearsService.activer(id);
  }
}
