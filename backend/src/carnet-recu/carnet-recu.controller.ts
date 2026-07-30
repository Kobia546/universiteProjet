import { Body, Controller, Get, Post } from '@nestjs/common';
import { CarnetRecuService } from './carnet-recu.service';
import { ConfigurerCarnetDto } from './dto/configurer-carnet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('carnets-recu')
export class CarnetRecuController {
  constructor(private readonly carnetRecuService: CarnetRecuService) {}

  @Get()
  findAll() {
    return this.carnetRecuService.findAll();
  }

  @Post()
  configurer(@Body() dto: ConfigurerCarnetDto, @CurrentUser() user: { userId: string }) {
    return this.carnetRecuService.configurer(dto, user.userId);
  }
}
