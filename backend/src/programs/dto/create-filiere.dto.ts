import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFiliereDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
