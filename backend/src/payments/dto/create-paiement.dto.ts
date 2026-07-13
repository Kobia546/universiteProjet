import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class CreatePaiementDto {
  @IsString()
  inscriptionId: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsString()
  motif: string;

  @IsEnum(ModePaiement, { message: 'Mode de paiement invalide' })
  modePaiement: ModePaiement;
}
