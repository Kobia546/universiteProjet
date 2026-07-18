import { apiClient } from '../../../shared/lib/apiClient';
import type { Sexe, TypeEtudiant } from '../../students/types';
import type { ModePaiement } from '../../payments/api/paymentsApi';

export interface CreateOnboardingInput {
  nom: string;
  prenom: string;
  sexe: Sexe;
  type?: TypeEtudiant;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  filiereId: string;
  anneeUniversitaireId: string;
  paiementInitial?: {
    montant: number;
    motif: string;
    modePaiement: ModePaiement;
  };
}

export interface OnboardingResult {
  etudiant: { id: string; matricule: string; nom: string; prenom: string };
  inscription: { id: string; numeroInscription: string };
  paiement: { id: string } | null;
}

export async function createOnboarding(input: CreateOnboardingInput): Promise<OnboardingResult> {
  const { data } = await apiClient.post<OnboardingResult>('/onboarding', input);
  return data;
}
