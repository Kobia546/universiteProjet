import { PrismaClient, RoleCode } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed en cours...');

  // ---- Rôles ----
  const roleComptabilite = await prisma.role.upsert({
    where: { code: RoleCode.COMPTABILITE },
    update: {},
    create: { code: RoleCode.COMPTABILITE, libelle: 'Comptable / Adjoint comptable' },
  });

  await prisma.role.upsert({
    where: { code: RoleCode.ADMIN },
    update: {},
    create: { code: RoleCode.ADMIN, libelle: 'Administrateur système' },
  });

  // ---- Filières (= niveaux, référentiel fixe) ----
  const filieresData = [
    { code: 'L1', libelle: 'Licence 1' },
    { code: 'L2', libelle: 'Licence 2' },
    { code: 'L3', libelle: 'Licence 3' },
    { code: 'M1', libelle: 'Master 1' },
    { code: 'M2', libelle: 'Master 2' },
  ];
  const filieres = [];
  for (const f of filieresData) {
    const filiere = await prisma.filiere.upsert({
      where: { code: f.code },
      update: {},
      create: f,
    });
    filieres.push(filiere);
  }

  // ---- Année universitaire courante ----
  const annee = await prisma.anneeUniversitaire.upsert({
    where: { id: 'seed-annee-2025-2026' },
    update: {},
    create: {
      id: 'seed-annee-2025-2026',
      libelle: '2025-2026',
      dateDebut: new Date('2025-10-01'),
      dateFin: new Date('2026-07-31'),
      active: true,
    },
  });

  // ---- Ouvrir toutes les filières pour l'année courante ----
  for (const filiere of filieres) {
    await prisma.filiereAnnee.upsert({
      where: {
        filiereId_anneeUniversitaireId: {
          filiereId: filiere.id,
          anneeUniversitaireId: annee.id,
        },
      },
      update: {},
      create: { filiereId: filiere.id, anneeUniversitaireId: annee.id, actif: true },
    });
  }

  // ---- Matières (catalogue), rattachées à toutes les filières ----
  const matieresData = [
    { nom: "Droit de l'Homme", code: 'DH' },
    { nom: 'Droit des Affaires', code: 'DA' },
    { nom: 'Droit des Contentieux', code: 'DC' },
    { nom: 'Fiscalité des Entreprises', code: 'FE' },
  ];
  for (const m of matieresData) {
    const matiere = await prisma.matiere.upsert({
      where: { code: m.code },
      update: { actif: true },
      create: { ...m, actif: true },
    });
    for (const filiere of filieres) {
      await prisma.filiereMatiere.upsert({
        where: { filiereId_matiereId: { filiereId: filiere.id, matiereId: matiere.id } },
        update: {},
        create: { filiereId: filiere.id, matiereId: matiere.id },
      });
    }
  }

  // ---- Scolarité par filière et par type (étudiant/travailleur) ----
  // Ces montants sont propres à l'année 2025-2026 — chaque nouvelle année
  // universitaire aura ses propres règles, modifiables indépendamment
  // (historique conservé, rien n'écrase les années précédentes).
  const scolariteParFiliere: Record<string, { etudiant: number; travailleur: number }> = {
    L1: { etudiant: 100000, travailleur: 150000 },
    L2: { etudiant: 175000, travailleur: 200000 },
    L3: { etudiant: 320000, travailleur: 380000 },
    M1: { etudiant: 700000, travailleur: 1050000 },
    M2: { etudiant: 900000, travailleur: 1500000 },
  };

  for (const filiere of filieres) {
    const montants = scolariteParFiliere[filiere.code];
    if (!montants) continue;

    await prisma.reglePaiement.upsert({
      where: { id: `seed-regle-${filiere.code}-etudiant-2025-2026` },
      update: { montantTotal: montants.etudiant },
      create: {
        id: `seed-regle-${filiere.code}-etudiant-2025-2026`,
        filiereId: filiere.id,
        type: 'ETUDIANT',
        anneeUniversitaireId: annee.id,
        montantTotal: montants.etudiant,
        pourcentageInscription: 60,
        nombreEcheances: 3,
      },
    });

    await prisma.reglePaiement.upsert({
      where: { id: `seed-regle-${filiere.code}-travailleur-2025-2026` },
      update: { montantTotal: montants.travailleur },
      create: {
        id: `seed-regle-${filiere.code}-travailleur-2025-2026`,
        filiereId: filiere.id,
        type: 'TRAVAILLEUR',
        anneeUniversitaireId: annee.id,
        montantTotal: montants.travailleur,
        pourcentageInscription: 60,
        nombreEcheances: 3,
      },
    });
  }

  // ---- Comptes utilisateurs : comptable + adjoint (même rôle) ----
  const motDePasseParDefaut = 'ChangezMoi123!';
  const hash = await argon2.hash(motDePasseParDefaut);

  await prisma.user.upsert({
    where: { email: 'comptable@universite.local' },
    update: {},
    create: {
      nom: 'Comptable',
      prenom: 'Principal',
      email: 'comptable@universite.local',
      motDePasseHash: hash,
      roleId: roleComptabilite.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'adjoint@universite.local' },
    update: {},
    create: {
      nom: 'Adjoint',
      prenom: 'Comptable',
      email: 'adjoint@universite.local',
      motDePasseHash: hash,
      roleId: roleComptabilite.id,
    },
  });

  console.log('Seed terminé.');
  console.log('Comptes créés (mot de passe par défaut : ChangezMoi123!) :');
  console.log('  - comptable@universite.local');
  console.log('  - adjoint@universite.local');
  console.log('>>> Pensez à changer ces mots de passe avant la mise en production. <<<');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
