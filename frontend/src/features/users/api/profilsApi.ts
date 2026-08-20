import { apiClient } from '../../../shared/lib/apiClient';
import type { ModuleCode } from '../../../shared/components/layout/navItems';

export interface Profil {
  id: string;
  nom: string;
  description: string | null;
  modules: ModuleCode[];
  systeme: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
}

export interface CreateProfilInput {
  nom: string;
  description?: string;
  modules: ModuleCode[];
}

export type UpdateProfilInput = Partial<CreateProfilInput>;

export async function fetchProfils(): Promise<Profil[]> {
  const { data } = await apiClient.get<Profil[]>('/profils');
  return data;
}

export async function createProfil(input: CreateProfilInput): Promise<Profil> {
  const { data } = await apiClient.post<Profil>('/profils', input);
  return data;
}

export async function updateProfil(id: string, input: UpdateProfilInput): Promise<Profil> {
  const { data } = await apiClient.patch<Profil>(`/profils/${id}`, input);
  return data;
}

export async function deleteProfil(id: string): Promise<void> {
  await apiClient.delete(`/profils/${id}`);
}
