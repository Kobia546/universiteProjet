import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CarnetRecuService } from './carnet-recu.service';
import { CreateCarnetDto } from './dto/create-carnet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('carnets-recu')
export class CarnetRecuController {
  constructor(private readonly carnetRecuService: CarnetRecuService) {}

  @Get()
  findAll() {
    return this.carnetRecuService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCarnetDto, @CurrentUser() user: { userId: string }) {
    return this.carnetRecuService.create(dto, user.userId);
  }

  @Patch(':id/fermer')
  fermer(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.carnetRecuService.fermer(id, user.userId);
  }
}
