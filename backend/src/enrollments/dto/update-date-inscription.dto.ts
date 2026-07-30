import { IsDateString } from 'class-validator';

export class UpdateDateInscriptionDto {
  @IsDateString()
  dateInscription: string;
}
