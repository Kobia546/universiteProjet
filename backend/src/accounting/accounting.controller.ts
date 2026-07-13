import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { CreateRecetteManuelleDto } from './dto/create-recette-manuelle.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ---- EP703 ----

  @Get('ep703')
  findAllRecettes(@Query('dateDebut') dateDebut?: string, @Query('dateFin') dateFin?: string) {
    return this.accountingService.findAllRecettes({ dateDebut, dateFin });
  }

  @Post('ep703/manuelle')
  creerRecetteManuelle(
    @Body() dto: CreateRecetteManuelleDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.accountingService.creerRecetteManuelle(dto, user.userId);
  }

  @Patch('ep703/:id/contre-passer')
  contrePasserRecette(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.accountingService.contrePasserRecette(id, user.userId);
  }

  // ---- EP704 ----

  @Get('ep704')
  findAllDepenses(@Query('dateDebut') dateDebut?: string, @Query('dateFin') dateFin?: string) {
    return this.accountingService.findAllDepenses({ dateDebut, dateFin });
  }

  @Post('ep704')
  createDepense(@Body() dto: CreateDepenseDto, @CurrentUser() user: { userId: string }) {
    return this.accountingService.createDepense(dto, user.userId);
  }

  @Patch('ep704/:id/contre-passer')
  contrePasserDepense(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.accountingService.contrePasserDepense(id, user.userId);
  }

  // ---- EP706 ----

  @Get('ep706')
  getCentralisateur(@Query('dateDebut') dateDebut?: string, @Query('dateFin') dateFin?: string) {
    return this.accountingService.getCentralisateur({ dateDebut, dateFin });
  }
}
