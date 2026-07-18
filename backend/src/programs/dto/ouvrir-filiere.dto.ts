import { IsString } from 'class-validator';

export class OuvrirFiliereDto {
  @IsString()
  filiereId: string;

  @IsString()
  anneeUniversitaireId: string;
}
