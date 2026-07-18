import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { MatriculeService } from './matricule.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, MatriculeService],
  exports: [StudentsService],
})
export class StudentsModule {}
