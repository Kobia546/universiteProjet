import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRecetteManuelleDto {
  @IsString()
  libelle: string;

  @IsOptional()
  @IsString()
  requerant?: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  pieceJustificativeUrl?: string;
}
