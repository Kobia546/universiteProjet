import { IsString } from 'class-validator';

export class RattacherMatiereDto {
  @IsString()
  niveauId: string;

  @IsString()
  matiereId: string;
}
