import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ModuleCode } from '@prisma/client';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { ProfilesService } from './profiles.service';
import { CreateProfilDto } from './dto/create-profil.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';

@RequireModule(ModuleCode.ADMINISTRATION)
@Controller('profils')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateProfilDto) {
    return this.profilesService.create(dto);
  }

  @Get()
  findAll() {
    return this.profilesService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfilDto) {
    return this.profilesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profilesService.remove(id);
  }
}
