import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMatiereDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(1)
  code: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
