import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { NiveauxController, FilieresController, MatieresController } from './programs.controller';

@Module({
  controllers: [NiveauxController, FilieresController, MatieresController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
