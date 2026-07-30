-- CreateTable
CREATE TABLE "carnets_recu" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "prefixe" TEXT NOT NULL DEFAULT 'REC',
    "prochainNumero" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carnets_recu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carnets_recu_annee_key" ON "carnets_recu"("annee");
