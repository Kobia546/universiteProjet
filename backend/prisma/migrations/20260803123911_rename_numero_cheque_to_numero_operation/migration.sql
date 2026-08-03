/*
  Warnings:

  - You are about to drop the column `numeroCheque` on the `ep704_depenses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numeroOperation]` on the table `ep704_depenses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroOperation` to the `ep704_depenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX IF EXISTS "ep704_depenses_numeroCheque_key";

-- AlterTable
ALTER TABLE "ep704_depenses"
  ADD COLUMN "numeroOperation" TEXT;

UPDATE "ep704_depenses"
SET "numeroOperation" = COALESCE("numeroCheque", 'OP-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-000001');

ALTER TABLE "ep704_depenses"
  ALTER COLUMN "numeroOperation" SET NOT NULL;

ALTER TABLE "ep704_depenses"
  DROP COLUMN "numeroCheque";

-- CreateIndex
CREATE UNIQUE INDEX "ep704_depenses_numeroOperation_key" ON "ep704_depenses"("numeroOperation");
