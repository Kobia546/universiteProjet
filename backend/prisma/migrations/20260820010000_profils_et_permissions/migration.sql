-- CreateEnum
CREATE TYPE "ModuleCode" AS ENUM ('TABLEAU_DE_BORD', 'ADMINISTRATION', 'INSCRIPTIONS', 'ETUDIANTS', 'PAIEMENTS', 'COMPTABILITE', 'CONSULTATIONS', 'EDITIONS', 'AIDE');

-- CreateTable
CREATE TABLE "profils" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "modules" "ModuleCode"[],
    "systeme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profils_nom_key" ON "profils"("nom");

-- Profils par défaut — mêmes noms/valeurs que les upserts de prisma/seed.ts, pour
-- que le seed les mette simplement à jour au lieu d'en créer des doublons.
INSERT INTO "profils" ("id", "nom", "description", "modules", "systeme", "createdAt", "updatedAt") VALUES
  ('c9a1a1a1-0000-4000-8000-000000000001', 'Administrateur', 'Accès complet à toutes les fonctionnalités, y compris la gestion des comptes.', ARRAY['TABLEAU_DE_BORD','ADMINISTRATION','INSCRIPTIONS','ETUDIANTS','PAIEMENTS','COMPTABILITE','CONSULTATIONS','EDITIONS','AIDE']::"ModuleCode"[], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c9a1a1a1-0000-4000-8000-000000000002', 'Comptabilité', 'Comptable / adjoint comptable — tout sauf l''administration des comptes.', ARRAY['TABLEAU_DE_BORD','INSCRIPTIONS','ETUDIANTS','PAIEMENTS','COMPTABILITE','CONSULTATIONS','EDITIONS','AIDE']::"ModuleCode"[], false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c9a1a1a1-0000-4000-8000-000000000003', 'Visiteur', 'Accès restreint, à personnaliser selon les besoins.', ARRAY['TABLEAU_DE_BORD','ADMINISTRATION']::"ModuleCode"[], false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Rattache les utilisateurs existants (créés par l'ancien seed, tous sur l'ancien
-- rôle COMPTABILITE) au profil Comptabilité — prisma/seed.ts les remettra à jour
-- juste après (comptable@/adjoint@) sur les bons profils par email.
ALTER TABLE "users" ADD COLUMN "profilId" TEXT;
UPDATE "users" SET "profilId" = 'c9a1a1a1-0000-4000-8000-000000000002';
ALTER TABLE "users" ALTER COLUMN "profilId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropTable
DROP TABLE "roles";

-- DropEnum
DROP TYPE "RoleCode";
