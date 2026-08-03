import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TypeOperationCaisse {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
}

export enum TypePaiementOperation {
  ESPECES = 'ESPECES',
  CHEQUE = 'CHEQUE',
}

export class CreateOperationCaisseDto {
  @IsEnum(TypeOperationCaisse, { message: 'Le type doit être ENTREE ou SORTIE' })
  type: TypeOperationCaisse;

  @IsOptional()
  @IsString()
  requerant?: string;

  @IsString()
  objet: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  /** Par défaut la date du jour si non précisée. */
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(TypePaiementOperation, { message: 'Le type de paiement doit être ESPECES ou CHEQUE' })
  modePaiement?: TypePaiementOperation;

  @IsOptional()
  @IsString()
  banque?: string;

  @IsOptional()
  @IsString()
  numeroCheque?: string;
}
