import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Sexe, TypeEtudiant, ModePaiement } from '@prisma/client';

class PaiementInitialDto {
  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsString()
  motif: string;

  @IsEnum(ModePaiement, { message: 'Mode de paiement invalide' })
  modePaiement: ModePaiement;
}

export class CreateOnboardingDto {
  // ---- Étudiant existant (si fourni, les champs ci-dessous sont ignorés) ----
  @IsOptional()
  @IsString()
  etudiantId?: string;

  // ---- Nouvel étudiant (requis seulement si etudiantId n'est pas fourni) ----
  @IsOptional()
  @IsString()
  @MinLength(2)
  nom?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  prenom?: string;

  @IsOptional()
  @IsEnum(Sexe, { message: 'Le sexe doit être M ou F' })
  sexe?: Sexe;

  @IsOptional()
  @IsEnum(TypeEtudiant, { message: 'Le type doit être ETUDIANT ou TRAVAILLEUR' })
  type?: TypeEtudiant;

  @IsOptional()
  @IsDateString()
  dateNaissance?: string;

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

  // ---- Inscription ----
  @IsString()
  filiereId: string;

  @IsString()
  anneeUniversitaireId: string;

  // ---- Premier paiement (optionnel) ----
  @IsOptional()
  @ValidateNested()
  @Type(() => PaiementInitialDto)
  paiementInitial?: PaiementInitialDto;
}
