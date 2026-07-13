import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateAnneeDto {
  @IsString()
  libelle: string;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
