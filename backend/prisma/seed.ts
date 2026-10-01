import { PrismaClient, ModuleCode } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const TOUS_LES_MODULES = Object.values(ModuleCode);

async function main() {
  console.log('Seed en cours...');

  // ---- Profils ----
  const profilAdmin = await prisma.profil.upsert({
    where: { nom: 'Administrateur' },
    update: {},
    create: {
      nom: 'Administrateur',
      description: 'Accès complet à toutes les fonctionnalités, y compris la gestion des comptes.',
      modules: TOUS_LES_MODULES,
      systeme: true,
    },
  });

  const profilComptabilite = await prisma.profil.upsert({
    where: { nom: 'Comptabilité' },
    update: {},
    create: {
      nom: 'Comptabilité',
      description: 'Comptable / adjoint comptable — tout sauf l\'administration des comptes.',
      modules: TOUS_LES_MODULES.filter((m) => m !== ModuleCode.ADMINISTRATION),
    },
  });

  await prisma.profil.upsert({
    where: { nom: 'Visiteur' },
    update: {},
    create: {
      nom: 'Visiteur',
      description: 'Accès restreint, à personnaliser selon les besoins.',
      modules: [ModuleCode.TABLEAU_DE_BORD],
    },
  });

  // ---- Niveaux (référentiel fixe) ----
  const niveauxData = [
    { code: 'L1', libelle: 'Licence 1' },
    { code: 'L2', libelle: 'Licence 2' },
    { code: 'L3', libelle: 'Licence 3' },
    { code: 'M1', libelle: 'Master 1' },
    { code: 'M2', libelle: 'Master 2' },
  ];
  const niveaux = [];
  for (const n of niveauxData) {
    const niveau = await prisma.niveau.upsert({
      where: { code: n.code },
      update: {},
      create: n,
    });
    niveaux.push(niveau);
  }

  // ---- Filières (spécialités choisies à l'inscription, après le niveau) ----
  const filieresData = [
    { id: 'filiere-dh', code: 'DH', libelle: "Droit de l'Homme" },
    { id: 'filiere-da', code: 'DA', libelle: 'Droit des Affaires' },
    { id: 'filiere-dc', code: 'DC', libelle: 'Droit des Contentieux' },
    { id: 'filiere-fe', code: 'FE', libelle: 'Fiscalité des Entreprises' },
    { id: 'filiere-de', code: 'DE', libelle: "Droit de l'Environnement" },
  ];
  for (const f of filieresData) {
    await prisma.filiere.upsert({
      where: { code: f.code },
      update: {},
      create: { ...f, actif: true },
    });
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

  // ---- Ouvrir tous les niveaux pour l'année courante ----
  for (const niveau of niveaux) {
    await prisma.niveauAnnee.upsert({
      where: {
        niveauId_anneeUniversitaireId: {
          niveauId: niveau.id,
          anneeUniversitaireId: annee.id,
        },
      },
      update: {},
      create: { niveauId: niveau.id, anneeUniversitaireId: annee.id, actif: true },
    });
  }

  // ---- Scolarité par niveau et par type (étudiant/travailleur) ----
  // Ces montants sont propres à l'année 2025-2026 — chaque nouvelle année
  // universitaire aura ses propres règles, modifiables indépendamment
  // (historique conservé, rien n'écrase les années précédentes).
  const scolariteParNiveau: Record<string, { etudiant: number; travailleur: number }> = {
    L1: { etudiant: 100000, travailleur: 150000 },
    L2: { etudiant: 175000, travailleur: 200000 },
    L3: { etudiant: 320000, travailleur: 380000 },
    M1: { etudiant: 700000, travailleur: 1050000 },
    M2: { etudiant: 900000, travailleur: 1500000 },
  };

  for (const niveau of niveaux) {
    const montants = scolariteParNiveau[niveau.code];
    if (!montants) continue;

    await prisma.reglePaiement.upsert({
      where: { id: `seed-regle-${niveau.code}-etudiant-2025-2026` },
      update: { montantTotal: montants.etudiant },
      create: {
        id: `seed-regle-${niveau.code}-etudiant-2025-2026`,
        niveauId: niveau.id,
        type: 'ETUDIANT',
        anneeUniversitaireId: annee.id,
        montantTotal: montants.etudiant,
        pourcentageInscription: 60,
        nombreEcheances: 3,
      },
    });

    await prisma.reglePaiement.upsert({
      where: { id: `seed-regle-${niveau.code}-travailleur-2025-2026` },
      update: { montantTotal: montants.travailleur },
      create: {
        id: `seed-regle-${niveau.code}-travailleur-2025-2026`,
        niveauId: niveau.id,
        type: 'TRAVAILLEUR',
        anneeUniversitaireId: annee.id,
        montantTotal: montants.travailleur,
        pourcentageInscription: 60,
        nombreEcheances: 3,
      },
    });
  }

  // ---- Comptes utilisateurs : admin + comptable + adjoint ----
  const motDePasseParDefaut = 'ChangezMoi123!';
  const hash = await argon2.hash(motDePasseParDefaut);

  await prisma.user.upsert({
    where: { email: 'admin@universite.local' },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@universite.local',
      motDePasseHash: hash,
      profilId: profilAdmin.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'comptable@universite.local' },
    update: {},
    create: {
      nom: 'Comptable',
      prenom: 'Principal',
      email: 'comptable@universite.local',
      motDePasseHash: hash,
      profilId: profilComptabilite.id,
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
      profilId: profilComptabilite.id,
    },
  });

  console.log('Seed terminé.');
  console.log('Comptes créés (mot de passe par défaut : ChangezMoi123!) :');
  console.log('  - admin@universite.local (profil Administrateur)');
  console.log('  - comptable@universite.local (profil Comptabilité)');
  console.log('  - adjoint@universite.local (profil Comptabilité)');
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
