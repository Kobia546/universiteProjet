export type Sexe = 'M' | 'F';
export type TypeEtudiant = 'ETUDIANT' | 'TRAVAILLEUR';

export interface Etudiant {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  type: TypeEtudiant;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  photoUrl?: string;
  informationsComplementaires?: string;
  createdAt: string;
  updatedAt: string;
  // Présents sur la liste (GET /etudiants) — statut global tous comptes faits
  statutPaiement?: 'SOLDE' | 'DOIT' | 'AUCUNE_INSCRIPTION';
  resteAPayer?: number;
  // Présents uniquement sur la vue détail (GET /etudiants/:id)
  inscriptions?: Array<{
    id: string;
    numeroInscription: string;
    statut: string;
    montantTotalDu?: number | string;
    totalPaye?: number;
    resteAPayer?: number;
    filiere?: { id: string; code: string; libelle: string };
    anneeUniversitaire?: { id: string; libelle: string };
  }>;
  paiements?: Array<{
    id: string;
    datePaiement: string;
    motif: string;
    modePaiement: string;
    montant: number | string;
    statut?: 'VALIDE' | 'ANNULE';
  }>;
}

export interface CreateEtudiantInput {
  nom: string;
  prenom: string;
  sexe: Sexe;
  type?: TypeEtudiant;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  informationsComplementaires?: string;
}

export interface EtudiantStatutPaiement {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  telephone?: string | null;
  inscriptions: Array<{ filiere: string; anneeUniversitaire: string }>;
  totalDu: number;
  totalPaye: number;
  resteAPayer: number;
}
