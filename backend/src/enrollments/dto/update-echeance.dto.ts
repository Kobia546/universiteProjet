import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateEcheanceDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  montantPrevu?: number;

  @IsOptional()
  @IsDateString()
  dateLimite?: string;
}
