import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatutInscription } from '@prisma/client';

export class UpdateInscriptionDto {
  @IsOptional()
  @IsString()
  niveauId?: string;

  @IsOptional()
  @IsString()
  filiereId?: string;

  @IsOptional()
  @IsEnum(StatutInscription)
  statut?: StatutInscription;
}
