DELETE FROM "carnets_recu";
/*
  Warnings:

  - The values [VIREMENT,MOBILE_MONEY] on the enum `ModePaiement` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `annee` on the `carnets_recu` table. All the data in the column will be lost.
  - You are about to drop the column `prefixe` on the `carnets_recu` table. All the data in the column will be lost.
  - You are about to drop the column `prochainNumero` on the `carnets_recu` table. All the data in the column will be lost.
  - Added the required column `numeroDebut` to the `carnets_recu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numeroFin` to the `carnets_recu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModePaiement_new" AS ENUM ('ESPECES', 'CHEQUE');
ALTER TABLE "paiements" ALTER COLUMN "modePaiement" TYPE "ModePaiement_new" USING ("modePaiement"::text::"ModePaiement_new");
ALTER TYPE "ModePaiement" RENAME TO "ModePaiement_old";
ALTER TYPE "ModePaiement_new" RENAME TO "ModePaiement";
DROP TYPE "ModePaiement_old";
COMMIT;

-- DropIndex
DROP INDEX "carnets_recu_annee_key";

-- AlterTable
ALTER TABLE "carnets_recu" DROP COLUMN "annee",
DROP COLUMN "prefixe",
DROP COLUMN "prochainNumero",
ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numeroDebut" INTEGER NOT NULL,
ADD COLUMN     "numeroFin" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "paiements" ADD COLUMN     "banque" TEXT,
ADD COLUMN     "numeroCheque" TEXT;

-- AlterTable
ALTER TABLE "recus" ADD COLUMN     "carnetRecuId" TEXT;

-- AddForeignKey
ALTER TABLE "recus" ADD CONSTRAINT "recus_carnetRecuId_fkey" FOREIGN KEY ("carnetRecuId") REFERENCES "carnets_recu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
