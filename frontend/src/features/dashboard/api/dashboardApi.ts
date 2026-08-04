import { apiClient } from '../../../shared/lib/apiClient';

export interface DashboardStats {
  anneeUniversitaire: { id: string; libelle: string } | null;
  moisAffiche: string;
  totalUniversitaires: number;
  nouveauxInscrits: number;
  revenusDuMois: number;
  depensesDuMois: number;
  solde: number;
  tauxReglementInscriptions: number;
  tauxReglementScolarite: number;
  repartitionParFiliere: { filiere: string; total: number }[];
  repartitionParType: { type: 'ETUDIANT' | 'TRAVAILLEUR'; total: number }[];
  evolution6Mois: { mois: string; recettes: number; depenses: number }[];
  dernieresOperations: {
    id: string;
    type: 'recette' | 'depense';
    libelle: string;
    montant: number;
    date: string;
  }[];
}

export async function fetchDashboardStats(anneeUniversitaireId?: string): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard', {
    params: anneeUniversitaireId ? { anneeUniversitaireId } : {},
  });
  return data;
}
