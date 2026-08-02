import { Module } from '@nestjs/common';
import { CarnetRecuService } from './carnet-recu.service';
import { CarnetRecuController } from './carnet-recu.controller';

@Module({
  controllers: [CarnetRecuController],
  providers: [CarnetRecuService],
  exports: [CarnetRecuService],
})
export class CarnetRecuModule {}
