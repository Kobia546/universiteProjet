import { apiClient } from '../../shared/lib/apiClient';

export interface Niveau {
  id: string;
  code: string;
  libelle: string;
}

export interface Filiere {
  id: string;
  nom: string;
  code: string;
  actif: boolean;
  filiereNiveaux?: Array<{
    id: string;
    niveauId: string;
    anneeUniversitaireId: string;
    actif: boolean;
    niveau: Niveau;
  }>;
}

export interface AnneeUniversitaire {
  id: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
}

export async function fetchFilieres(): Promise<Filiere[]> {
  const { data } = await apiClient.get<Filiere[]>('/filieres');
  return data;
}

export async function createFiliere(input: { nom: string; code: string }): Promise<Filiere> {
  const { data } = await apiClient.post<Filiere>('/filieres', input);
  return data;
}

export async function ouvrirNiveau(input: {
  filiereId: string;
  niveauId: string;
  anneeUniversitaireId: string;
}): Promise<void> {
  await apiClient.post('/filieres/ouvrir-niveau', input);
}

export async function fetchNiveaux(): Promise<Niveau[]> {
  const { data } = await apiClient.get<Niveau[]>('/filieres/niveaux');
  return data;
}

export async function fetchAnneesUniversitaires(): Promise<AnneeUniversitaire[]> {
  const { data } = await apiClient.get<AnneeUniversitaire[]>('/annees-universitaires');
  return data;
}

export async function createAnneeUniversitaire(input: {
  libelle: string;
  dateDebut: string;
  dateFin: string;
  active?: boolean;
}): Promise<AnneeUniversitaire> {
  const { data } = await apiClient.post<AnneeUniversitaire>('/annees-universitaires', input);
  return data;
}

export async function activerAnneeUniversitaire(id: string): Promise<AnneeUniversitaire> {
  const { data } = await apiClient.patch<AnneeUniversitaire>(`/annees-universitaires/${id}/activer`);
  return data;
}
