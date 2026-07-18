import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { TypeEtudiant } from '@prisma/client';

export class CreateReglePaiementDto {
  @IsOptional()
  @IsString()
  filiereId?: string; // absent = règle générale (s'applique à toutes les filières)

  @IsOptional()
  @IsEnum(TypeEtudiant, { message: 'Le type doit être ETUDIANT ou TRAVAILLEUR' })
  type?: TypeEtudiant; // absent = s'applique aux deux types

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
