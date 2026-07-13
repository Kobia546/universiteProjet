const UNITES = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];

const DIZAINES = [
  '',
  '',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
  'soixante',
  'quatre-vingt',
  'quatre-vingt',
];

function centaineEnLettres(n: number): string {
  if (n === 0) return '';

  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  let mots = '';

  if (centaines > 0) {
    mots += (centaines > 1 ? UNITES[centaines] + ' cent' : 'cent') + (reste === 0 && centaines > 1 ? 's' : '');
    if (reste > 0) mots += ' ';
  }

  if (reste > 0) {
    if (reste < 20) {
      mots += UNITES[reste];
    } else {
      const dizaine = Math.floor(reste / 10);
      const unite = reste % 10;
      if (dizaine === 7 || dizaine === 9) {
        mots += DIZAINES[dizaine] + (dizaine === 7 ? '-' : '-') + UNITES[10 + unite];
      } else {
        mots += DIZAINES[dizaine] + (unite > 0 ? '-' + UNITES[unite] : unite === 0 && dizaine === 8 ? 's' : '');
      }
    }
  }

  return mots;
}

/**
 * Convertit un montant entier (FCFA) en toutes lettres, façon reçu papier.
 * Ex : 150000 -> "cent cinquante mille francs CFA"
 */
export function montantEnLettres(montant: number): string {
  const n = Math.round(Math.abs(montant));
  if (n === 0) return 'zéro franc CFA';

  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const unites = n % 1000;

  const parties: string[] = [];

  if (millions > 0) {
    parties.push((millions > 1 ? centaineEnLettres(millions) + ' millions' : 'un million'));
  }
  if (milliers > 0) {
    parties.push(milliers === 1 ? 'mille' : centaineEnLettres(milliers) + ' mille');
  }
  if (unites > 0) {
    parties.push(centaineEnLettres(unites));
  }

  const resultat = parties.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return `${resultat} francs CFA`;
}
