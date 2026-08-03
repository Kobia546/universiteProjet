import { apiClient } from '../../../shared/lib/apiClient';

export interface EcritureRecette {
  id: string;
  numeroBordereau: string;
  date: string;
  libelle: string;
  requerant?: string | null;
  compteDebit: string;
  compteCredit: string;
  montant: number | string;
  statut: 'VALIDE' | 'CONTRE_PASSE';
  agent: { nom: string; prenom: string };
  paiement?: { etudiant: { nom: string; prenom: string; matricule: string } } | null;
}

export interface EcritureDepense {
  id: string;
  numeroOperation: string;
  date: string;
  libelle: string;
  requerant?: string | null;
  compteDebit: string;
  compteCredit: string;
  montant: number | string;
  statut: 'VALIDE' | 'CONTRE_PASSE';
  agent: { nom: string; prenom: string };
}

export type TypeOperationCaisse = 'ENTREE' | 'SORTIE';
export type TypePaiementOperation = 'ESPECES' | 'CHEQUE';

export interface CreateOperationCaisseInput {
  type: TypeOperationCaisse;
  requerant?: string;
  objet: string;
  montant: number;
  date?: string;
  modePaiement?: TypePaiementOperation;
  banque?: string;
  numeroCheque?: string;
}

export async function creerOperationCaisse(
  input: CreateOperationCaisseInput,
): Promise<EcritureRecette | EcritureDepense> {
  const { data } = await apiClient.post('/operations-caisse', input);
  return data;
}

export interface Centralisateur {
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  nombreOperations: number;
  periode: { dateDebut: string | null; dateFin: string | null };
}

export async function fetchEp703(params?: {
  dateDebut?: string;
  dateFin?: string;
}): Promise<EcritureRecette[]> {
  const { data } = await apiClient.get<EcritureRecette[]>('/ep703', { params });
  return data;
}

export async function contrePasserRecette(id: string): Promise<EcritureRecette> {
  const { data } = await apiClient.patch<EcritureRecette>(`/ep703/${id}/contre-passer`);
  return data;
}

export async function creerRecetteManuelle(input: {
  libelle: string;
  montant: number;
  pieceJustificativeUrl?: string;
}): Promise<EcritureRecette> {
  const { data } = await apiClient.post<EcritureRecette>('/ep703/manuelle', input);
  return data;
}

export async function fetchEp704(params?: {
  dateDebut?: string;
  dateFin?: string;
}): Promise<EcritureDepense[]> {
  const { data } = await apiClient.get<EcritureDepense[]>('/ep704', { params });
  return data;
}

export async function creerDepense(input: {
  libelle: string;
  montant: number;
  justificatifUrl?: string;
}): Promise<EcritureDepense> {
  const { data } = await apiClient.post<EcritureDepense>('/ep704', input);
  return data;
}

export async function contrePasserDepense(id: string): Promise<EcritureDepense> {
  const { data } = await apiClient.patch<EcritureDepense>(`/ep704/${id}/contre-passer`);
  return data;
}

export async function fetchEp706(params?: {
  dateDebut?: string;
  dateFin?: string;
}): Promise<Centralisateur> {
  const { data } = await apiClient.get<Centralisateur>('/ep706', { params });
  return data;
}
