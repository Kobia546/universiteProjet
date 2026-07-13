-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('COMPTABILITE', 'ADMIN');

-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_COURS', 'VALIDEE', 'ANNULEE', 'TRANSFEREE');

-- CreateEnum
CREATE TYPE "StatutEcheance" AS ENUM ('A_PAYER', 'PARTIEL', 'SOLDE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('VALIDE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutEcriture" AS ENUM ('VALIDE', 'CONTRE_PASSE');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ressourceType" TEXT NOT NULL,
    "ressourceId" TEXT NOT NULL,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiants" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" "Sexe" NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "lieuNaissance" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "photoUrl" TEXT,
    "informationsComplementaires" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveaux" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annees_universitaires" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "annees_universitaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filiere_niveaux" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "anneeUniversitaireId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "filiere_niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "numeroInscription" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "anneeUniversitaireId" TEXT NOT NULL,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_COURS',
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotalDu" DECIMAL(12,2) NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regles_paiement" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT,
    "niveauId" TEXT,
    "anneeUniversitaireId" TEXT NOT NULL,
    "montantTotal" DECIMAL(12,2) NOT NULL,
    "pourcentageInscription" INTEGER NOT NULL,
    "nombreEcheances" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regles_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echeances" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "numeroEcheance" INTEGER NOT NULL,
    "montantPrevu" DECIMAL(12,2) NOT NULL,
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "statut" "StatutEcheance" NOT NULL DEFAULT 'A_PAYER',

    CONSTRAINT "echeances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "referenceUnique" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'VALIDE',
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recus" (
    "id" TEXT NOT NULL,
    "numeroRecu" TEXT NOT NULL,
    "paiementId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ep703_recettes" (
    "id" TEXT NOT NULL,
    "numeroBordereau" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "libelle" TEXT NOT NULL,
    "compteDebit" TEXT NOT NULL DEFAULT '565',
    "compteCredit" TEXT NOT NULL DEFAULT '445',
    "montant" DECIMAL(12,2) NOT NULL,
    "paiementId" TEXT,
    "pieceJustificativeUrl" TEXT,
    "statut" "StatutEcriture" NOT NULL DEFAULT 'VALIDE',
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ep703_recettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ep704_depenses" (
    "id" TEXT NOT NULL,
    "numeroCheque" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "libelle" TEXT NOT NULL,
    "compteDebit" TEXT NOT NULL DEFAULT '445',
    "compteCredit" TEXT NOT NULL DEFAULT '565',
    "montant" DECIMAL(12,2) NOT NULL,
    "justificatifUrl" TEXT,
    "statut" "StatutEcriture" NOT NULL DEFAULT 'VALIDE',
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ep704_depenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_log_ressourceType_ressourceId_idx" ON "audit_log"("ressourceType", "ressourceId");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_matricule_key" ON "etudiants"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_code_key" ON "niveaux"("code");

-- CreateIndex
CREATE UNIQUE INDEX "filiere_niveaux_filiereId_niveauId_anneeUniversitaireId_key" ON "filiere_niveaux"("filiereId", "niveauId", "anneeUniversitaireId");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_numeroInscription_key" ON "inscriptions"("numeroInscription");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_referenceUnique_key" ON "paiements"("referenceUnique");

-- CreateIndex
CREATE UNIQUE INDEX "recus_numeroRecu_key" ON "recus"("numeroRecu");

-- CreateIndex
CREATE UNIQUE INDEX "recus_paiementId_key" ON "recus"("paiementId");

-- CreateIndex
CREATE UNIQUE INDEX "ep703_recettes_numeroBordereau_key" ON "ep703_recettes"("numeroBordereau");

-- CreateIndex
CREATE UNIQUE INDEX "ep703_recettes_paiementId_key" ON "ep703_recettes"("paiementId");

-- CreateIndex
CREATE UNIQUE INDEX "ep704_depenses_numeroCheque_key" ON "ep704_depenses"("numeroCheque");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiere_niveaux" ADD CONSTRAINT "filiere_niveaux_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiere_niveaux" ADD CONSTRAINT "filiere_niveaux_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filiere_niveaux" ADD CONSTRAINT "filiere_niveaux_anneeUniversitaireId_fkey" FOREIGN KEY ("anneeUniversitaireId") REFERENCES "annees_universitaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_anneeUniversitaireId_fkey" FOREIGN KEY ("anneeUniversitaireId") REFERENCES "annees_universitaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles_paiement" ADD CONSTRAINT "regles_paiement_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles_paiement" ADD CONSTRAINT "regles_paiement_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles_paiement" ADD CONSTRAINT "regles_paiement_anneeUniversitaireId_fkey" FOREIGN KEY ("anneeUniversitaireId") REFERENCES "annees_universitaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "echeances" ADD CONSTRAINT "echeances_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recus" ADD CONSTRAINT "recus_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ep703_recettes" ADD CONSTRAINT "ep703_recettes_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ep703_recettes" ADD CONSTRAINT "ep703_recettes_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ep704_depenses" ADD CONSTRAINT "ep704_depenses_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
