import { IsInt, Min } from 'class-validator';

export class CreateCarnetDto {
  @IsInt()
  @Min(1)
  numeroDebut: number;

  @IsInt()
  @Min(1)
  numeroFin: number;
}
