import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ModePaiement } from '@prisma/client';

export class CreatePaiementDto {
  @IsString()
  inscriptionId: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsString()
  motif?: string;

  @IsEnum(ModePaiement, { message: 'Mode de paiement invalide' })
  modePaiement: ModePaiement;

  /**
   * Numéro du reçu physique tel qu'écrit sur le carnet papier — saisi par
   * le comptable pour faire correspondre l'app avec le carnet, et vérifié
   * contre les plages configurées dans Paramètres → Carnets de reçu.
   */
  @IsInt()
  @Min(1)
  numeroRecu: number;

  // Renseignés uniquement si modePaiement = CHEQUE
  @IsOptional()
  @IsString()
  numeroCheque?: string;

  @IsOptional()
  @IsString()
  banque?: string;
}
