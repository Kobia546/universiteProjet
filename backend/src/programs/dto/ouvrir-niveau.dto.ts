import { IsString } from 'class-validator';

export class OuvrirNiveauDto {
  @IsString()
  niveauId: string;

  @IsString()
  anneeUniversitaireId: string;
}
