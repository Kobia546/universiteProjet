import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReglePaiementDto {
  @IsOptional()
  @IsString()
  filiereId?: string; // absent = règle générale (s'applique à toutes les filières)

  @IsOptional()
  @IsString()
  niveauId?: string; // absent = règle générale pour tous les niveaux

  @IsString()
  anneeUniversitaireId: string;

  @IsNumber()
  @Min(0)
  montantTotal: number;

  @IsInt()
  @Min(0)
  @Max(100)
  pourcentageInscription: number; // ex: 60

  @IsInt()
  @Min(1)
  nombreEcheances: number;
}
