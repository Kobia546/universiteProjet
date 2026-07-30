import { apiClient } from '../../../shared/lib/apiClient';

export interface CarnetRecu {
  id: string;
  annee: number;
  prefixe: string;
  prochainNumero: number;
  updatedAt: string;
}

export interface ConfigurerCarnetInput {
  annee: number;
  prefixe?: string;
  prochainNumero: number;
}

export async function fetchCarnetsRecu(): Promise<CarnetRecu[]> {
  const { data } = await apiClient.get<CarnetRecu[]>('/carnets-recu');
  return data;
}

export async function configurerCarnetRecu(input: ConfigurerCarnetInput): Promise<CarnetRecu> {
  const { data } = await apiClient.post<CarnetRecu>('/carnets-recu', input);
  return data;
}
