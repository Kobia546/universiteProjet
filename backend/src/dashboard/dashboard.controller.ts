import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getStats(@Query('anneeUniversitaireId') anneeUniversitaireId?: string) {
    return this.dashboardService.getStats(anneeUniversitaireId);
  }
}
