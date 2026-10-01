import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFiliereDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  libelle: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
