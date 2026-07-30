import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ConfigurerCarnetDto {
  @IsInt()
  annee: number;

  @IsOptional()
  @IsString()
  prefixe?: string;

  @IsInt()
  @Min(1)
  prochainNumero: number;
}
