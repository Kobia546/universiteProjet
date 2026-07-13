import { apiClient } from '../../../shared/lib/apiClient';
import type { CreateEtudiantInput, Etudiant } from '../types';

export async function fetchEtudiants(recherche?: string): Promise<Etudiant[]> {
  const { data } = await apiClient.get<Etudiant[]>('/etudiants', {
    params: recherche ? { recherche } : {},
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
