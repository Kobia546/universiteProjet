import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCarnetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  numeroDebut?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  numeroFin?: number;
}
