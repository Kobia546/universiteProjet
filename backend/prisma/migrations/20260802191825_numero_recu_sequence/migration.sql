/*
  Warnings:

  - A unique constraint covering the columns `[numeroSequence]` on the table `recus` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "recus" ADD COLUMN     "numeroSequence" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recus_numeroSequence_key" ON "recus"("numeroSequence");
