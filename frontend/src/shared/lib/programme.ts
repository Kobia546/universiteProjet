export interface NiveauRef {
  code: string;
  libelle: string;
}
export interface FiliereRef {
  code: string;
  libelle: string;
}

/**
 * Libellé complet d'un programme : « Licence 1 – Droit des Affaires ».
 * Si la filière n'est pas connue (inscription historique), on affiche le
 * niveau seul.
 */
export function libelleProgramme(
  niveau?: NiveauRef | null,
  filiere?: FiliereRef | null,
): string {
  if (!niveau) return filiere?.libelle ?? '—';
  return filiere ? `${niveau.libelle} – ${filiere.libelle}` : niveau.libelle;
}

/** Version courte : « L1 – DA ». */
export function codeProgramme(niveau?: NiveauRef | null, filiere?: FiliereRef | null): string {
  if (!niveau) return filiere?.code ?? '—';
  return filiere ? `${niveau.code} – ${filiere.code}` : niveau.code;
}
