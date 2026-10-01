import { apiClient } from '../../../shared/lib/apiClient';

export interface NumeroExclu {
  id: string;
  numero: number;
  motif: string | null;
  createdAt: string;
}

export interface CarnetRecu {
  id: string;
  numeroDebut: number;
  numeroFin: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  // Statistiques calculées par l'API
  total: number;
  nbUtilises: number;
  nbExclus: number;
  nbRestants: number;
  prochainNumero: number | null;
  exclusions: NumeroExclu[];
}

export interface CreateCarnetInput {
  numeroDebut: number;
  numeroFin: number;
}

export async function fetchCarnetsRecu(): Promise<CarnetRecu[]> {
  const { data } = await apiClient.get<CarnetRecu[]>('/carnets-recu');
  return data;
}

export async function createCarnetRecu(input: CreateCarnetInput): Promise<CarnetRecu> {
  const { data } = await apiClient.post<CarnetRecu>('/carnets-recu', input);
  return data;
}

export async function updateCarnetRecu(
  id: string,
  input: Partial<CreateCarnetInput>,
): Promise<CarnetRecu> {
  const { data } = await apiClient.patch<CarnetRecu>(`/carnets-recu/${id}`, input);
  return data;
}

export async function fermerCarnetRecu(id: string): Promise<CarnetRecu> {
  const { data } = await apiClient.patch<CarnetRecu>(`/carnets-recu/${id}/fermer`);
  return data;
}

export async function rouvrirCarnetRecu(id: string): Promise<CarnetRecu> {
  const { data } = await apiClient.patch<CarnetRecu>(`/carnets-recu/${id}/rouvrir`);
  return data;
}

export async function deleteCarnetRecu(id: string): Promise<void> {
  await apiClient.delete(`/carnets-recu/${id}`);
}

/** Déclare des numéros arrachés / supprimés sur le carnet papier. */
export async function ajouterNumerosSupprimes(
  carnetId: string,
  input: { numeros: number[]; motif?: string },
): Promise<{ ajoutes: number; dejaDeclares: number }> {
  const { data } = await apiClient.post(`/carnets-recu/${carnetId}/numeros-supprimes`, input);
  return data;
}

export async function retirerNumeroSupprime(carnetId: string, exclusionId: string): Promise<void> {
  await apiClient.delete(`/carnets-recu/${carnetId}/numeros-supprimes/${exclusionId}`);
}
