import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateInscriptionDto {
  @IsString()
  etudiantId: string;

  @IsString()
  filiereId: string;

  @IsString()
  anneeUniversitaireId: string;

  /**
   * La vraie date d'inscription telle qu'elle figure sur le carnet papier
   * — par défaut la date du jour, mais peut être différente de la date de
   * saisie si le comptable encaisse d'abord sur le carnet et ne saisit
   * dans l'app que plus tard. Distincte de `createdAt` (horodatage exact
   * de la saisie informatique, jamais modifiable).
   */
  @IsOptional()
  @IsDateString()
  dateInscription?: string;
}
