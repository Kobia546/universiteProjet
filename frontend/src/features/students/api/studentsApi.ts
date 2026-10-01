import { apiClient } from '../../../shared/lib/apiClient';
import type { CreateEtudiantInput, Etudiant, EtudiantStatutPaiement } from '../types';

function cleanParams(p?: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(p ?? {}).filter(([, v]) => !!v));
}

export async function fetchEtudiants(params?: {
  recherche?: string;
  niveauId?: string;
  filiereId?: string;
  anneeUniversitaireId?: string;
}): Promise<Etudiant[]> {
  const { data } = await apiClient.get<Etudiant[]>('/etudiants', {
    params: params ?? {},
  });
  return data;
}

export async function fetchEtudiantsParStatutPaiement(
  statut: 'doit' | 'solde',
  filtres?: { anneeUniversitaireId?: string; niveauId?: string; filiereId?: string },
): Promise<EtudiantStatutPaiement[]> {
  const { data } = await apiClient.get<EtudiantStatutPaiement[]>('/etudiants/statut-paiement', {
    params: { statut, ...cleanParams(filtres) },
  });
  return data;
}

export async function fetchEtudiant(id: string): Promise<Etudiant> {
  const { data } = await apiClient.get<Etudiant>(`/etudiants/${id}`);
  return data;
}

export async function createEtudiant(input: CreateEtudiantInput): Promise<Etudiant> {
  const { data } = await apiClient.post<Etudiant>('/etudiants', input);
  return data;
}

export async function updateEtudiant(
  id: string,
  input: Partial<CreateEtudiantInput>,
): Promise<Etudiant> {
  const { data } = await apiClient.patch<Etudiant>(`/etudiants/${id}`, input);
  return data;
}

/** Suppression définitive (administrateur) : tout le dossier de l'étudiant. */
export async function supprimerEtudiant(id: string): Promise<void> {
  await apiClient.delete(`/etudiants/${id}`);
}
