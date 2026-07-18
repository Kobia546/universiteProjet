import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController, MatieresController } from './programs.controller';

@Module({
  controllers: [ProgramsController, MatieresController],
  providers: [ProgramsService],
})
export class ProgramsModule {}
