import { apiClient } from '../../../shared/lib/apiClient';

export interface DashboardStats {
  totalEtudiants: number;
  nouveauxInscrits: number;
  revenusDuMois: number;
  depensesDuMois: number;
  solde: number;
  paiementsEnAttente: { nombre: number; montant: number };
  repartitionParFiliere: { filiere: string; total: number }[];
  dernieresOperations: {
    id: string;
    type: 'paiement';
    libelle: string;
    montant: number;
    date: string;
  }[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard');
  return data;
}
