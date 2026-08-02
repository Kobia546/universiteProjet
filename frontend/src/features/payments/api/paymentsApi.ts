import { apiClient } from '../../../shared/lib/apiClient';

export type ModePaiement = 'ESPECES' | 'CHEQUE';

export interface Paiement {
  id: string;
  referenceUnique: string;
  montant: number | string;
  motif: string;
  modePaiement: ModePaiement;
  numeroCheque?: string | null;
  banque?: string | null;
  datePaiement: string;
  statut: 'VALIDE' | 'ANNULE';
  estPaiementSoldant?: boolean;
  resteAPayerInscription?: number;
  etudiant: { id: string; nom: string; prenom: string; matricule: string };
  inscription: {
    id: string;
    numeroInscription: string;
    montantTotalDu: number | string;
    filiere: { code: string; libelle: string };
    anneeUniversitaire?: { libelle: string };
    echeances?: Array<{
      id: string;
      numeroEcheance: number;
      montantPrevu: number | string;
      dateLimite: string;
      statut: 'A_PAYER' | 'PARTIEL' | 'SOLDE' | 'EN_RETARD';
    }>;
    paiements?: Array<{ id: string; montant: number | string; statut: 'VALIDE' | 'ANNULE' }>;
  };
  agent: { nom: string; prenom: string };
  recu?: { numeroRecu: string; numeroSequence: number; dateEmission: string };
}

export interface CreatePaiementInput {
  inscriptionId: string;
  montant: number;
  motif?: string;
  modePaiement: ModePaiement;
  numeroRecu: number;
  numeroCheque?: string;
  banque?: string;
}

export async function fetchPaiements(params?: {
  etudiantId?: string;
  inscriptionId?: string;
  anneeUniversitaireId?: string;
}): Promise<Paiement[]> {
  const { data } = await apiClient.get<Paiement[]>('/paiements', { params });
  return data;
}

export async function fetchPaiement(id: string): Promise<Paiement> {
  const { data } = await apiClient.get<Paiement>(`/paiements/${id}`);
  return data;
}

export async function createPaiement(input: CreatePaiementInput): Promise<Paiement> {
  const { data } = await apiClient.post<Paiement>('/paiements', input);
  return data;
}

export async function annulerPaiement(id: string): Promise<Paiement> {
  const { data } = await apiClient.patch<Paiement>(`/paiements/${id}/annuler`);
  return data;
}
