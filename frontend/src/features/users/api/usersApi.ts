import { apiClient } from '../../../shared/lib/apiClient';

export interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  actif: boolean;
  createdAt: string;
  profil: { id: string; nom: string };
}

export interface CreateUserInput {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  profilId: string;
}

export interface UpdateUserInput {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  profilId?: string;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const { data } = await apiClient.get<AppUser[]>('/users');
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>('/users', input);
  return data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<AppUser> {
  const { data } = await apiClient.patch<AppUser>(`/users/${id}`, input);
  return data;
}

export async function setUserActif(id: string, actif: boolean): Promise<AppUser> {
  const { data } = await apiClient.patch<AppUser>(`/users/${id}/actif`, { actif });
  return data;
}
