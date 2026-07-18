import { IsString } from 'class-validator';

export class RattacherMatiereDto {
  @IsString()
  filiereId: string;

  @IsString()
  matiereId: string;
}
