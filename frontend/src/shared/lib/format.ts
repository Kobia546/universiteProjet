export function formatMontant(montant: number | string | null | undefined): string {
  const valeur =
    montant === null || montant === undefined
      ? 0
      : typeof montant === 'string'
        ? parseFloat(montant)
        : montant;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(valeur);
}

/**
 * Formatage sûr pour les PDF (jsPDF). `formatMontant` utilise
 * Intl.NumberFormat, qui insère des espaces insécables spéciales (U+202F)
 * entre les milliers — invisibles dans le navigateur, mais les polices de
 * base de jsPDF (Helvetica) ne les supportent pas et affichent des
 * caractères corrompus ou rien du tout. On reconstruit donc le montant à
 * la main avec de simples espaces ASCII.
 */
export function formatMontantPdf(montant: number | string): string {
  const valeur = Math.round(typeof montant === 'string' ? parseFloat(montant) : montant);
  const partieEntiere = Math.abs(valeur)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${valeur < 0 ? '-' : ''}${partieEntiere} FCFA`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateHeure(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
