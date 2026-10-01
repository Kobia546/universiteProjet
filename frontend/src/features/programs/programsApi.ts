import { apiClient } from '../../shared/lib/apiClient';

export interface Matiere {
  id: string;
  nom: string;
  code: string;
  actif: boolean;
  niveaux?: Array<{ id: string; niveauId: string; niveau: { id: string; code: string; libelle: string } }>;
}

/** Niveau d'études : L1, L2, L3, M1, M2. */
export interface Niveau {
  id: string;
  code: string;
  libelle: string;
  anneesOuvertes?: Array<{
    id: string;
    anneeUniversitaireId: string;
    actif: boolean;
    anneeUniversitaire: { id: string; libelle: string };
  }>;
  matieres?: Array<{ id: string; matiereId: string; matiere: Matiere }>;
  _count?: { inscriptions: number };
}

/** Filière (spécialité) : Droit des Affaires, etc. */
export interface Filiere {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
  _count?: { inscriptions: number };
}

export interface AnneeUniversitaire {
  id: string;
  libelle: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
}

// ---- Niveaux ----

export async function fetchNiveaux(): Promise<Niveau[]> {
  const { data } = await apiClient.get<Niveau[]>('/niveaux');
  return data;
}

export async function createNiveau(input: { code: string; libelle: string }): Promise<Niveau> {
  const { data } = await apiClient.post<Niveau>('/niveaux', input);
  return data;
}

export async function updateNiveau(
  id: string,
  input: { code?: string; libelle?: string },
): Promise<Niveau> {
  const { data } = await apiClient.patch<Niveau>(`/niveaux/${id}`, input);
  return data;
}

export async function deleteNiveau(id: string): Promise<void> {
  await apiClient.delete(`/niveaux/${id}`);
}

export async function ouvrirNiveau(input: {
  niveauId: string;
  anneeUniversitaireId: string;
}): Promise<void> {
  await apiClient.post('/niveaux/ouvrir', input);
}

export async function fermerOuvertureNiveau(ouvertureId: string): Promise<void> {
  await apiClient.patch(`/niveaux/ouvertures/${ouvertureId}/fermer`);
}

// ---- Filières ----

export async function fetchFilieres(actifsSeulement = false): Promise<Filiere[]> {
  const { data } = await apiClient.get<Filiere[]>('/filieres', {
    params: actifsSeulement ? { actifsSeulement: 'true' } : {},
  });
  return data;
}

export async function createFiliere(input: {
  code: string;
  libelle: string;
  actif?: boolean;
}): Promise<Filiere> {
  const { data } = await apiClient.post<Filiere>('/filieres', input);
  return data;
}

export async function updateFiliere(
  id: string,
  input: { code?: string; libelle?: string; actif?: boolean },
): Promise<Filiere> {
  const { data } = await apiClient.patch<Filiere>(`/filieres/${id}`, input);
  return data;
}

export async function deleteFiliere(id: string): Promise<void> {
  await apiClient.delete(`/filieres/${id}`);
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

export async function updateMatiere(
  id: string,
  input: { nom?: string; code?: string; actif?: boolean },
): Promise<Matiere> {
  const { data } = await apiClient.patch<Matiere>(`/matieres/${id}`, input);
  return data;
}

export async function deleteMatiere(id: string): Promise<void> {
  await apiClient.delete(`/matieres/${id}`);
}

export async function rattacherMatiere(input: {
  niveauId: string;
  matiereId: string;
}): Promise<void> {
  await apiClient.post('/niveaux/matieres/rattacher', input);
}

export async function detacherMatiere(rattachementId: string): Promise<void> {
  await apiClient.delete(`/niveaux/matieres/rattachement/${rattachementId}`);
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

export async function updateAnneeUniversitaire(
  id: string,
  input: { libelle?: string; dateDebut?: string; dateFin?: string; active?: boolean },
): Promise<AnneeUniversitaire> {
  const { data } = await apiClient.patch<AnneeUniversitaire>(`/annees-universitaires/${id}`, input);
  return data;
}

export async function deleteAnneeUniversitaire(id: string): Promise<void> {
  await apiClient.delete(`/annees-universitaires/${id}`);
}

export async function activerAnneeUniversitaire(id: string): Promise<AnneeUniversitaire> {
  const { data } = await apiClient.patch<AnneeUniversitaire>(`/annees-universitaires/${id}/activer`);
  return data;
}
