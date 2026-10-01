import { IsString, MinLength } from 'class-validator';

export class CreateNiveauDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(2)
  libelle: string;
}
