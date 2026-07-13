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

  // ---- Niveaux (référentiel fixe) ----
  const niveaux = [
    { code: 'L1', libelle: 'Licence 1' },
    { code: 'L2', libelle: 'Licence 2' },
    { code: 'L3', libelle: 'Licence 3' },
    { code: 'M1', libelle: 'Master 1' },
    { code: 'M2', libelle: 'Master 2' },
  ];
  for (const niveau of niveaux) {
    await prisma.niveau.upsert({
      where: { code: niveau.code },
      update: {},
      create: niveau,
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

  // ---- Filières d'exemple ----
  const filieres = [
    { nom: "Droit de l'Homme", code: 'DH' },
    { nom: 'Droit des Affaires', code: 'DA' },
    { nom: 'Droit des Contentieux', code: 'DC' },
    { nom: 'Fiscalité des Entreprises', code: 'FE' },
  ];
  for (const filiere of filieres) {
    const f = await prisma.filiere.upsert({
      where: { code: filiere.code },
      update: {},
      create: filiere,
    });

    // Ouvre L1 à M2 pour chaque filière sur l'année courante
    for (const niveau of niveaux) {
      const n = await prisma.niveau.findUnique({ where: { code: niveau.code } });
      if (n) {
        await prisma.filiereNiveau.upsert({
          where: {
            filiereId_niveauId_anneeUniversitaireId: {
              filiereId: f.id,
              niveauId: n.id,
              anneeUniversitaireId: annee.id,
            },
          },
          update: {},
          create: { filiereId: f.id, niveauId: n.id, anneeUniversitaireId: annee.id },
        });
      }
    }
  }

  // ---- Règle de paiement générale par défaut (pour tester les inscriptions) ----
  // S'applique à toutes les filières/niveaux de l'année courante, sauf règle plus spécifique.
  await prisma.reglePaiement.upsert({
    where: { id: 'seed-regle-generale-2025-2026' },
    update: {},
    create: {
      id: 'seed-regle-generale-2025-2026',
      filiereId: null,
      niveauId: null,
      anneeUniversitaireId: annee.id,
      montantTotal: 500000,
      pourcentageInscription: 60,
      nombreEcheances: 3,
    },
  });

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
