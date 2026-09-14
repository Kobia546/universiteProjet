/**
 * Import ponctuel : reçus/scolarité des Master II — année universitaire
 * 2025-2026, à partir du classeur Excel papier historique.
 *
 * Contexte / choix assumés (voir discussion avec l'utilisateur) :
 * - Chaque feuille = une spécialité de M2. Il n'existe pas de notion de
 *   spécialité dans le schéma : elle est notée dans
 *   `informationsComplementaires`, avec le nom brut "NOM ET PRENOMS" tel
 *   quel (filet de sécurité si le découpage nom/prénom automatique se
 *   trompe).
 * - Les feuilles "(2)" sont des versions plus à jour (versements
 *   supplémentaires) des mêmes élèves — elles remplacent la ligne de la
 *   feuille principale pour la même spécialité.
 * - sexe / dateNaissance / matricule n'existent pas dans le fichier :
 *   sexe et dateNaissance restent `null` (à compléter plus tard dans
 *   l'app), matricule est généré (M2-2025-XXXX).
 * - Les versements (1er à 4e VERSE) deviennent des Paiement "historiques"
 *   marqués comme tels : référence préfixée HIST-M2-2025-…, datés du jour
 *   de l'import, mode ESPECES par défaut — pour qu'on les distingue
 *   toujours des vrais reçus saisis au comptoir. Aucune écriture EP703
 *   (comptabilité) n'est générée pour l'instant.
 * - Idempotent : relancer le script ne duplique pas un étudiant déjà
 *   importé (recherché par nom brut + spécialité dans
 *   informationsComplementaires) — mais ne remet pas non plus à jour ses
 *   paiements si l'étudiant existe déjà (pour ne jamais dupliquer un
 *   paiement déjà inséré).
 *
 * Usage : depuis backend/, `npx ts-node scripts/import-m2-2025-2026.ts [chemin-du-fichier.xlsx]`
 */
import * as XLSX from 'xlsx';
import { PrismaClient, TypeEtudiant, ModePaiement, StatutPaiement, StatutInscription } from '@prisma/client';

const prisma = new PrismaClient();

const CHEMIN_FICHIER =
  process.argv[2] || 'C:/Users/hp/Downloads/erp-universite/MASTER II  2025-2026.xlsx';

const LIBELLE_ANNEE = '2025-2026';
const CODE_FILIERE = 'M2';

// Feuille -> spécialité affichée. Les paires "(2)" pointent vers la même
// spécialité que leur feuille principale : elles écrasent ses lignes.
const FEUILLES: { nom: string; specialite: string; miseAJourDe?: string }[] = [
  { nom: 'DROIT ENV', specialite: "Droit de l'Environnement" },
  { nom: 'M2 DH', specialite: 'Droit de l’Homme' },
  { nom: 'M2 D AFF ', specialite: 'Droit des Affaires' },
  { nom: 'M2 D AFF  (2)', specialite: 'Droit des Affaires', miseAJourDe: 'M2 D AFF ' },
  { nom: 'M2 FISC E ', specialite: 'Fiscalité des Entreprises' },
  { nom: 'M2 FISC E  (2)', specialite: 'Fiscalité des Entreprises', miseAJourDe: 'M2 FISC E ' },
  { nom: 'M2 DROIT CONT ', specialite: 'Droit des Contentieux' },
  { nom: 'M2 DROIT CONT  (2)', specialite: 'Droit des Contentieux', miseAJourDe: 'M2 DROIT CONT ' },
];

interface LigneEleve {
  specialite: string;
  nomBrut: string;
  montant: number;
  verses: number[]; // 1er..4e, 0 si vide
}

function normaliserNom(nom: string): string {
  return nom.trim().replace(/\s+/g, ' ').toUpperCase();
}

function extraireLignes(sheet: XLSX.WorkSheet, specialite: string): Map<string, LigneEleve> {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const map = new Map<string, LigneEleve>();
  for (const row of rows) {
    const nomBrut = String(row[1] ?? '').trim();
    if (!nomBrut || nomBrut === 'NOM ET PRENOMS') continue;
    const montant = Number(row[2]) || 0;
    if (montant <= 0) continue;
    const verses = [3, 4, 5, 6].map((i) => Number(row[i]) || 0);
    map.set(normaliserNom(nomBrut), { specialite, nomBrut, montant, verses });
  }
  return map;
}

function decouperNomPrenom(nomBrut: string): { nom: string; prenom: string } {
  const parts = nomBrut.trim().replace(/\s+/g, ' ').split(' ');
  return { nom: parts[0], prenom: parts.slice(1).join(' ') || parts[0] };
}

function devinerType(montant: number): { type: TypeEtudiant; montantParticulier: boolean } {
  if (montant >= 1000000) return { type: TypeEtudiant.TRAVAILLEUR, montantParticulier: montant !== 1200000 };
  return { type: TypeEtudiant.ETUDIANT, montantParticulier: montant !== 850000 };
}

async function main() {
  console.log(`Lecture de "${CHEMIN_FICHIER}"...`);
  const wb = XLSX.readFile(CHEMIN_FICHIER);

  // 1. Regrouper par spécialité, en laissant les feuilles "(2)" écraser
  //    les lignes des mêmes élèves dans leur feuille principale.
  const parSpecialite = new Map<string, Map<string, LigneEleve>>();
  for (const f of FEUILLES) {
    const sheet = wb.Sheets[f.nom];
    if (!sheet) {
      console.warn(`  ! Feuille "${f.nom}" introuvable, ignorée.`);
      continue;
    }
    const lignes = extraireLignes(sheet, f.specialite);
    if (!parSpecialite.has(f.specialite)) parSpecialite.set(f.specialite, new Map());
    const cible = parSpecialite.get(f.specialite)!;
    for (const [cle, ligne] of lignes) cible.set(cle, ligne); // "(2)" écrase si même clé
    console.log(`  - ${f.nom}: ${lignes.size} ligne(s)${f.miseAJourDe ? ' (mise à jour)' : ''}`);
  }

  // 2. Pré-requis en base.
  const annee = await prisma.anneeUniversitaire.findFirst({ where: { libelle: LIBELLE_ANNEE } });
  if (!annee) throw new Error(`Année universitaire "${LIBELLE_ANNEE}" introuvable — lancez le seed d'abord.`);

  const filiere = await prisma.filiere.findUnique({ where: { code: CODE_FILIERE } });
  if (!filiere) throw new Error(`Filière "${CODE_FILIERE}" introuvable — lancez le seed d'abord.`);

  const agent =
    (await prisma.user.findUnique({ where: { email: 'admin@universite.local' } })) ??
    (await prisma.user.findFirst());
  if (!agent) throw new Error('Aucun utilisateur en base pour servir de "agent" — lancez le seed d’abord.');

  let compteurMatricule = await prisma.etudiant.count();
  let crees = 0;
  let ignores = 0;
  let paiementsCreesTotal = 0;

  for (const [specialite, lignes] of parSpecialite) {
    for (const [, ligne] of lignes) {
      const tagSpecialite = `Spécialité M2 : ${specialite}`;
      const { nom, prenom } = decouperNomPrenom(ligne.nomBrut);

      // Idempotence : déjà importé ? (même nom brut + même spécialité)
      const existant = await prisma.etudiant.findFirst({
        where: {
          nom,
          prenom,
          informationsComplementaires: { contains: tagSpecialite },
        },
      });
      if (existant) {
        ignores++;
        continue;
      }

      compteurMatricule++;
      const matricule = `M2-2025-${String(compteurMatricule).padStart(4, '0')}`;
      const { type, montantParticulier } = devinerType(ligne.montant);

      const notes = [
        tagSpecialite,
        `Nom brut (fichier) : "${ligne.nomBrut}"`,
        montantParticulier ? `Montant particulier relevé dans le fichier : ${ligne.montant} FCFA` : null,
        'Importé depuis le classeur "MASTER II 2025-2026" (historique, sexe/date de naissance à compléter).',
      ]
        .filter(Boolean)
        .join('\n');

      const etudiant = await prisma.etudiant.create({
        data: {
          matricule,
          nom,
          prenom,
          type,
          informationsComplementaires: notes,
        },
      });

      const numeroInscription = `INS-${matricule}`;
      const inscription = await prisma.inscription.create({
        data: {
          numeroInscription,
          etudiantId: etudiant.id,
          filiereId: filiere.id,
          anneeUniversitaireId: annee.id,
          statut: StatutInscription.VALIDEE,
          montantTotalDu: ligne.montant,
          agentId: agent.id,
        },
      });

      let numeroVersement = 0;
      for (const montantVerse of ligne.verses) {
        numeroVersement++;
        if (montantVerse <= 0) continue;
        await prisma.paiement.create({
          data: {
            referenceUnique: `HIST-${matricule}-${numeroVersement}`,
            inscriptionId: inscription.id,
            etudiantId: etudiant.id,
            montant: montantVerse,
            motif: `Versement ${numeroVersement} - Scolarité M2 2025-2026 (import historique)`,
            modePaiement: ModePaiement.ESPECES,
            statut: StatutPaiement.VALIDE,
            agentId: agent.id,
          },
        });
        paiementsCreesTotal++;
      }

      crees++;
    }
  }

  console.log('');
  console.log(`Terminé : ${crees} étudiant(s) créé(s), ${ignores} déjà présent(s) (ignoré(s)), ${paiementsCreesTotal} paiement(s) historique(s) créé(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
