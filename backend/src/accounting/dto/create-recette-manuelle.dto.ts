import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRecetteManuelleDto {
  @IsString()
  libelle: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsString()
  pieceJustificativeUrl?: string;
}
