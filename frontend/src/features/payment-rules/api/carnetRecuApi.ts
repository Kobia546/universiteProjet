import { apiClient } from '../../../shared/lib/apiClient';

export interface CarnetRecu {
  id: string;
  numeroDebut: number;
  numeroFin: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
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

export async function fermerCarnetRecu(id: string): Promise<CarnetRecu> {
  const { data } = await apiClient.patch<CarnetRecu>(`/carnets-recu/${id}/fermer`);
  return data;
}
