import { apiClient } from '../../../shared/lib/apiClient';

export interface Echeance {
  id: string;
  numeroEcheance: number;
  montantPrevu: number | string;
  dateLimite: string;
  statut: 'A_PAYER' | 'PARTIEL' | 'SOLDE' | 'EN_RETARD';
}

export interface Inscription {
  id: string;
  numeroInscription: string;
  statut: 'EN_COURS' | 'VALIDEE' | 'ANNULEE' | 'TRANSFEREE';
  dateInscription: string;
  createdAt?: string;
  montantTotalDu: number | string;
  totalPaye?: number;
  resteAPayer?: number;
  etudiant: { id: string; nom: string; prenom: string; matricule: string };
  niveau: { id: string; code: string; libelle: string };
  filiere?: { id: string; code: string; libelle: string } | null;
  anneeUniversitaire: { id: string; libelle: string };
  echeances?: Echeance[];
  paiements?: Array<{ id: string; montant: number | string; statut: 'VALIDE' | 'ANNULE' }>;
}

export interface CreateInscriptionInput {
  etudiantId: string;
  niveauId: string;
  filiereId: string;
  anneeUniversitaireId: string;
  dateInscription?: string;
}

export async function fetchInscriptions(params?: {
  anneeUniversitaireId?: string;
  niveauId?: string;
  filiereId?: string;
  statut?: string;
}): Promise<Inscription[]> {
  const { data } = await apiClient.get<Inscription[]>('/inscriptions', { params });
  return data;
}

export async function fetchInscription(id: string): Promise<Inscription> {
  const { data } = await apiClient.get<Inscription>(`/inscriptions/${id}`);
  return data;
}

export async function createInscription(input: CreateInscriptionInput): Promise<Inscription> {
  const { data } = await apiClient.post<Inscription>('/inscriptions', input);
  return data;
}

export async function modifierDateInscription(
  id: string,
  dateInscription: string,
): Promise<Inscription> {
  const { data } = await apiClient.patch<Inscription>(`/inscriptions/${id}/date-inscription`, {
    dateInscription,
  });
  return data;
}

export async function ajouterEcheance(
  inscriptionId: string,
  input: { montantPrevu: number; dateLimite: string },
): Promise<Echeance> {
  const { data } = await apiClient.post<Echeance>(
    `/inscriptions/${inscriptionId}/echeances`,
    input,
  );
  return data;
}

export async function modifierEcheance(
  inscriptionId: string,
  echeanceId: string,
  input: { montantPrevu?: number; dateLimite?: string },
): Promise<Echeance> {
  const { data } = await apiClient.patch<Echeance>(
    `/inscriptions/${inscriptionId}/echeances/${echeanceId}`,
    input,
  );
  return data;
}

export async function supprimerEcheance(
  inscriptionId: string,
  echeanceId: string,
): Promise<void> {
  await apiClient.delete(`/inscriptions/${inscriptionId}/echeances/${echeanceId}`);
}

/** Correction administrateur du niveau, de la filière ou du statut. */
export async function modifierInscription(
  id: string,
  input: { niveauId?: string; filiereId?: string; statut?: Inscription['statut'] },
): Promise<Inscription> {
  const { data } = await apiClient.patch<Inscription>(`/inscriptions/${id}`, input);
  return data;
}

/** Suppression définitive (administrateur) : paiements et reçus inclus. */
export async function supprimerInscription(id: string): Promise<void> {
  await apiClient.delete(`/inscriptions/${id}`);
}
