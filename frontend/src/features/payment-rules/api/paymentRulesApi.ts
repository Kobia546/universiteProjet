import { apiClient } from '../../../shared/lib/apiClient';

export interface ReglePaiement {
  id: string;
  filiereId: string | null;
  niveauId: string | null;
  anneeUniversitaireId: string;
  montantTotal: number | string;
  pourcentageInscription: number;
  nombreEcheances: number;
  filiere?: { nom: string } | null;
  niveau?: { code: string } | null;
  anneeUniversitaire?: { libelle: string };
}

export interface CreateReglePaiementInput {
  filiereId?: string;
  niveauId?: string;
  anneeUniversitaireId: string;
  montantTotal: number;
  pourcentageInscription: number;
  nombreEcheances: number;
}

export async function fetchReglesPaiement(anneeUniversitaireId?: string): Promise<ReglePaiement[]> {
  const { data } = await apiClient.get<ReglePaiement[]>('/regles-paiement', {
    params: anneeUniversitaireId ? { anneeUniversitaireId } : {},
  });
  return data;
}

export async function createReglePaiement(
  input: CreateReglePaiementInput,
): Promise<ReglePaiement> {
  const { data } = await apiClient.post<ReglePaiement>('/regles-paiement', input);
  return data;
}

export async function updateReglePaiement(
  id: string,
  input: Partial<CreateReglePaiementInput>,
): Promise<ReglePaiement> {
  const { data } = await apiClient.patch<ReglePaiement>(`/regles-paiement/${id}`, input);
  return data;
}

export async function deleteReglePaiement(id: string): Promise<void> {
  await apiClient.delete(`/regles-paiement/${id}`);
}
