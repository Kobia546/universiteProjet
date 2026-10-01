-- Niveaux (L1-M2) vs Filières (spécialités) + numéros de carnet exclus.
--
-- Jusqu'ici la table "filieres" contenait les NIVEAUX (L1, L2, L3, M1, M2).
-- Les spécialités (Droit des Affaires...) n'existaient que comme "matières".
-- Cette migration :
--   1. renomme les tables/colonnes "filiere*" existantes en "niveau*"
--      (aucune donnée n'est perdue ni déplacée, seuls les noms changent) ;
--   2. crée la nouvelle table "filieres" (spécialités) avec les 5 filières ;
--   3. ajoute "inscriptions.filiereId" (nullable) et rattache les
--      inscriptions M2 importées dont la spécialité est notée en texte libre ;
--   4. crée "numeros_carnet_exclus" (numéros arrachés/supprimés d'un carnet) ;
--   5. retire l'accès Administration au profil non-système « Visiteur ».

-- =====================================================================
-- 1. FILIERE (= niveau) -> NIVEAU
-- =====================================================================

ALTER TABLE "filieres" RENAME TO "niveaux";
ALTER TABLE "niveaux" RENAME CONSTRAINT "filieres_pkey" TO "niveaux_pkey";
ALTER INDEX "filieres_code_key" RENAME TO "niveaux_code_key";

ALTER TABLE "filiere_annees" RENAME TO "niveau_annees";
ALTER TABLE "niveau_annees" RENAME COLUMN "filiereId" TO "niveauId";
ALTER TABLE "niveau_annees" RENAME CONSTRAINT "filiere_annees_pkey" TO "niveau_annees_pkey";
ALTER TABLE "niveau_annees" RENAME CONSTRAINT "filiere_annees_filiereId_fkey" TO "niveau_annees_niveauId_fkey";
ALTER TABLE "niveau_annees" RENAME CONSTRAINT "filiere_annees_anneeUniversitaireId_fkey" TO "niveau_annees_anneeUniversitaireId_fkey";
ALTER INDEX "filiere_annees_filiereId_anneeUniversitaireId_key" RENAME TO "niveau_annees_niveauId_anneeUniversitaireId_key";

ALTER TABLE "filiere_matieres" RENAME TO "niveau_matieres";
ALTER TABLE "niveau_matieres" RENAME COLUMN "filiereId" TO "niveauId";
ALTER TABLE "niveau_matieres" RENAME CONSTRAINT "filiere_matieres_pkey" TO "niveau_matieres_pkey";
ALTER TABLE "niveau_matieres" RENAME CONSTRAINT "filiere_matieres_filiereId_fkey" TO "niveau_matieres_niveauId_fkey";
ALTER TABLE "niveau_matieres" RENAME CONSTRAINT "filiere_matieres_matiereId_fkey" TO "niveau_matieres_matiereId_fkey";
ALTER INDEX "filiere_matieres_filiereId_matiereId_key" RENAME TO "niveau_matieres_niveauId_matiereId_key";

ALTER TABLE "inscriptions" RENAME COLUMN "filiereId" TO "niveauId";
ALTER TABLE "inscriptions" RENAME CONSTRAINT "inscriptions_filiereId_fkey" TO "inscriptions_niveauId_fkey";

ALTER TABLE "regles_paiement" RENAME COLUMN "filiereId" TO "niveauId";
ALTER TABLE "regles_paiement" RENAME CONSTRAINT "regles_paiement_filiereId_fkey" TO "regles_paiement_niveauId_fkey";

-- =====================================================================
-- 2. NOUVELLE TABLE filieres (spécialités)
-- =====================================================================

CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

INSERT INTO "filieres" ("id", "code", "libelle", "actif") VALUES
    ('filiere-dh', 'DH', 'Droit de l''Homme', true),
    ('filiere-da', 'DA', 'Droit des Affaires', true),
    ('filiere-dc', 'DC', 'Droit des Contentieux', true),
    ('filiere-fe', 'FE', 'Fiscalité des Entreprises', true),
    ('filiere-de', 'DE', 'Droit de l''Environnement', true);

-- =====================================================================
-- 3. inscriptions.filiereId (nullable) + rattachement de l'historique
-- =====================================================================

ALTER TABLE "inscriptions" ADD COLUMN "filiereId" TEXT;

CREATE INDEX "inscriptions_niveauId_idx" ON "inscriptions"("niveauId");
CREATE INDEX "inscriptions_filiereId_idx" ON "inscriptions"("filiereId");

ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_filiereId_fkey"
    FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Les étudiants M2 importés depuis le classeur papier portent leur
-- spécialité dans "informationsComplementaires" (« Spécialité M2 : <nom> »).
-- On rattache leur inscription M2 à la filière correspondante. Le motif
-- utilise % à la place de l'apostrophe, car elle est tantôt droite (')
-- tantôt typographique (’) selon la saisie. Une spécialité inconnue laisse
-- simplement filiereId à NULL (à corriger depuis l'application).
UPDATE "inscriptions" AS i
SET "filiereId" = f."id"
FROM "etudiants" AS e,
     "niveaux" AS n,
     (VALUES
        ('DH', '%Spécialité M2 : Droit de l%Homme%'),
        ('DA', '%Spécialité M2 : Droit des Affaires%'),
        ('DC', '%Spécialité M2 : Droit des Contentieux%'),
        ('FE', '%Spécialité M2 : Fiscalité des Entreprises%'),
        ('DE', '%Spécialité M2 : Droit de l%Environnement%')
     ) AS m("code", "motif"),
     "filieres" AS f
WHERE i."etudiantId" = e."id"
  AND i."niveauId" = n."id"
  AND n."code" = 'M2'
  AND i."filiereId" IS NULL
  AND f."code" = m."code"
  AND e."informationsComplementaires" ILIKE m."motif";

-- =====================================================================
-- 4. Numéros de carnet exclus (arrachés / supprimés sur le carnet papier)
-- =====================================================================

CREATE TABLE "numeros_carnet_exclus" (
    "id" TEXT NOT NULL,
    "carnetRecuId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "numeros_carnet_exclus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "numeros_carnet_exclus_carnetRecuId_numero_key"
    ON "numeros_carnet_exclus"("carnetRecuId", "numero");

ALTER TABLE "numeros_carnet_exclus" ADD CONSTRAINT "numeros_carnet_exclus_carnetRecuId_fkey"
    FOREIGN KEY ("carnetRecuId") REFERENCES "carnets_recu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================
-- 5. Sécurité : le profil non-système « Visiteur » ne doit plus donner
--    accès au module ADMINISTRATION (il permet désormais de supprimer
--    des données). Les autres profils ne sont pas touchés.
-- =====================================================================

UPDATE "profils"
SET "modules" = array_remove("modules", 'ADMINISTRATION'::"ModuleCode")
WHERE "nom" = 'Visiteur' AND "systeme" = false;
