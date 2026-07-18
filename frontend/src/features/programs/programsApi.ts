import { apiClient } from '../../shared/lib/apiClient';

export interface Matiere {
  id: string;
  nom: string;
  code: string;
  actif: boolean;
  filieres?: Array<{ id: string; filiereId: string; filiere: { id: string; code: string } }>;
}

export interface Filiere {
  id: string;
  code: string; // L1, L2, L3, M1, M2
  libelle: string;
  anneesOuvertes?: Array<{
    id: string;
    anneeUniversitaireId: string;
    actif: boolean;
    anneeUniversitaire: { id: string; libelle: string };
  }>;
  matieres?: Array<{ id: string; matiereId: string; matiere: Matiere }>;
}

export interface AnneeUniversitaire {
  id: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
}

// ---- Filières ----

export async function fetchFilieres(): Promise<Filiere[]> {
  const { data } = await apiClient.get<Filiere[]>('/filieres');
  return data;
}

export async function ouvrirFiliere(input: {
  filiereId: string;
  anneeUniversitaireId: string;
}): Promise<void> {
  await apiClient.post('/filieres/ouvrir', input);
}

export async function fermerFiliere(id: string): Promise<void> {
  await apiClient.patch(`/filieres/${id}/fermer`);
}

// ---- Matières ----

export async function fetchMatieres(): Promise<Matiere[]> {
  const { data } = await apiClient.get<Matiere[]>('/matieres');
  return data;
}

export async function createMatiere(input: { nom: string; code: string }): Promise<Matiere> {
  const { data } = await apiClient.post<Matiere>('/matieres', input);
  return data;
}

export async function deleteMatiere(id: string): Promise<void> {
  await apiClient.delete(`/matieres/${id}`);
}

export async function rattacherMatiere(input: {
  filiereId: string;
  matiereId: string;
}): Promise<void> {
  await apiClient.post('/filieres/matieres/rattacher', input);
}

export async function detacherMatiere(rattachementId: string): Promise<void> {
  await apiClient.delete(`/filieres/matieres/rattachement/${rattachementId}`);
}

// ---- Années universitaires ----

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
