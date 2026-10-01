import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { CarnetRecuService } from './carnet-recu.service';
import { CreateCarnetDto } from './dto/create-carnet.dto';
import { UpdateCarnetDto } from './dto/update-carnet.dto';
import { AjouterExclusionsDto } from './dto/ajouter-exclusions.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/require-module.decorator';

type Agent = { userId: string };

@Controller('carnets-recu')
export class CarnetRecuController {
  constructor(private readonly carnetRecuService: CarnetRecuService) {}

  @Get()
  findAll() {
    return this.carnetRecuService.findAll();
  }

  @Post()
  @RequireModule(ModuleCode.ADMINISTRATION)
  create(@Body() dto: CreateCarnetDto, @CurrentUser() user: Agent) {
    return this.carnetRecuService.create(dto, user.userId);
  }

  @Patch(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  update(@Param('id') id: string, @Body() dto: UpdateCarnetDto, @CurrentUser() user: Agent) {
    return this.carnetRecuService.update(id, dto, user.userId);
  }

  @Patch(':id/fermer')
  @RequireModule(ModuleCode.ADMINISTRATION)
  fermer(@Param('id') id: string, @CurrentUser() user: Agent) {
    return this.carnetRecuService.fermer(id, user.userId);
  }

  @Patch(':id/rouvrir')
  @RequireModule(ModuleCode.ADMINISTRATION)
  rouvrir(@Param('id') id: string, @CurrentUser() user: Agent) {
    return this.carnetRecuService.rouvrir(id, user.userId);
  }

  @Delete(':id')
  @RequireModule(ModuleCode.ADMINISTRATION)
  remove(@Param('id') id: string, @CurrentUser() user: Agent) {
    return this.carnetRecuService.remove(id, user.userId);
  }

  @Post(':id/numeros-supprimes')
  @RequireModule(ModuleCode.ADMINISTRATION)
  ajouterExclusions(
    @Param('id') id: string,
    @Body() dto: AjouterExclusionsDto,
    @CurrentUser() user: Agent,
  ) {
    return this.carnetRecuService.ajouterExclusions(id, dto, user.userId);
  }

  @Delete(':id/numeros-supprimes/:exclusionId')
  @RequireModule(ModuleCode.ADMINISTRATION)
  retirerExclusion(
    @Param('id') id: string,
    @Param('exclusionId') exclusionId: string,
    @CurrentUser() user: Agent,
  ) {
    return this.carnetRecuService.retirerExclusion(id, exclusionId, user.userId);
  }
}
