import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TypeOperationCaisse {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
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
}
