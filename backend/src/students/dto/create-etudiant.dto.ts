import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Sexe } from '@prisma/client';

export class CreateEtudiantDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(2)
  prenom: string;

  @IsEnum(Sexe, { message: 'Le sexe doit être M ou F' })
  sexe: Sexe;

  @IsDateString()
  dateNaissance: string;

  @IsOptional()
  @IsString()
  lieuNaissance?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  informationsComplementaires?: string;
}
