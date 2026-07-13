import { IsString } from 'class-validator';

export class OuvrirNiveauDto {
  @IsString()
  filiereId: string;

  @IsString()
  niveauId: string;

  @IsString()
  anneeUniversitaireId: string;
}
