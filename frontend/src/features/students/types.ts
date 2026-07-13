export type Sexe = 'M' | 'F';

export interface Etudiant {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  photoUrl?: string;
  informationsComplementaires?: string;
  createdAt: string;
  updatedAt: string;
  // Présents uniquement sur la vue détail (GET /etudiants/:id)
  inscriptions?: Array<{
    id: string;
    numeroInscription: string;
    statut: string;
    filiere?: { nom: string };
    niveau?: { code: string };
    anneeUniversitaire?: { libelle: string };
  }>;
  paiements?: Array<{
    id: string;
    datePaiement: string;
    motif: string;
    modePaiement: string;
    montant: number | string;
  }>;
}

export interface CreateEtudiantInput {
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  informationsComplementaires?: string;
}
