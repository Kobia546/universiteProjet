import { IsString } from 'class-validator';

export class CreateInscriptionDto {
  @IsString()
  etudiantId: string;

  @IsString()
  filiereId: string;

  @IsString()
  niveauId: string;

  @IsString()
  anneeUniversitaireId: string;
}
