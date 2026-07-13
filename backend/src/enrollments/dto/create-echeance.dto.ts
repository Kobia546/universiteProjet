import { IsDateString, IsNumber, Min } from 'class-validator';

export class CreateEcheanceDto {
  @IsNumber()
  @Min(0.01)
  montantPrevu: number;

  @IsDateString()
  dateLimite: string;
}
