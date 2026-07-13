import { apiClient } from '../../../shared/lib/apiClient';

export type ModePaiement = 'ESPECES' | 'CHEQUE' | 'VIREMENT' | 'MOBILE_MONEY';

export interface Paiement {
  id: string;
  referenceUnique: string;
  montant: number | string;
  motif: string;
  modePaiement: ModePaiement;
  datePaiement: string;
  statut: 'VALIDE' | 'ANNULE';
  etudiant: { id: string; nom: string; prenom: string; matricule: string };
  inscription: {
    id: string;
    numeroInscription: string;
    montantTotalDu: number | string;
    filiere: { nom: string };
    niveau: { code: string };
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
  recu?: { numeroRecu: string; dateEmission: string };
}

export interface CreatePaiementInput {
  inscriptionId: string;
  montant: number;
  motif: string;
  modePaiement: ModePaiement;
}

export async function fetchPaiements(params?: {
  etudiantId?: string;
  inscriptionId?: string;
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
