-- Fusion des anciens « niveaux combinés » (L1-DA « L1 - Droit des Affaires »,
-- M2-GE « M2 - Gestion d'Entreprise »...) dans le vrai niveau + la filière.
--
-- Avant la séparation niveau/filière, certaines bases contenaient une ligne
-- par couple niveau+spécialité. La migration précédente les a renommées en
-- « niveaux », si bien que la liste des niveaux affichait « L1 - Droit des
-- Affaires » au lieu de seulement Licence 1, Licence 2, Licence 3, Master 1
-- et Master 2. Cette migration :
--   1. garantit l'existence des 5 niveaux L1, L2, L3, M1, M2 ;
--   2. crée les filières manquantes à partir du suffixe (CG, GE...) ;
--   3. reporte inscriptions, ouvertures, matières et règles de paiement
--      du niveau combiné vers le niveau de base (+ filière sur l'inscription) ;
--   4. supprime les niveaux combinés.
-- Idempotente : sans niveau combiné en base, elle ne fait rien.

-- =====================================================================
-- 1. Niveaux de base
-- =====================================================================

INSERT INTO "niveaux" ("id", "code", "libelle") VALUES
    (gen_random_uuid()::text, 'L1', 'Licence 1'),
    (gen_random_uuid()::text, 'L2', 'Licence 2'),
    (gen_random_uuid()::text, 'L3', 'Licence 3'),
    (gen_random_uuid()::text, 'M1', 'Master 1'),
    (gen_random_uuid()::text, 'M2', 'Master 2')
ON CONFLICT ("code") DO NOTHING;

-- Correspondance niveau combiné -> niveau de base + filière.
-- « L1 - Gestion d’Entreprise » -> filière « Gestion d'Entreprise ».
CREATE TEMP TABLE "_niveaux_combines" AS
SELECT n."id" AS "ancienId",
       b."id" AS "niveauId",
       upper(split_part(n."code", '-', 2)) AS "filiereCode",
       replace(
         trim(regexp_replace(n."libelle", '^\s*[A-Za-z0-9]+\s*[-–:]\s*', '')),
         '’', ''''
       ) AS "filiereLibelle"
FROM "niveaux" AS n
JOIN "niveaux" AS b ON b."code" = upper(split_part(n."code", '-', 1))
WHERE n."code" LIKE '%-%'
  AND split_part(n."code", '-', 2) <> '';

-- =====================================================================
-- 2. Filières manquantes
-- =====================================================================

INSERT INTO "filieres" ("id", "code", "libelle", "actif")
SELECT DISTINCT ON (c."filiereCode")
       'filiere-' || lower(c."filiereCode"), c."filiereCode", c."filiereLibelle", true
FROM "_niveaux_combines" AS c
WHERE NOT EXISTS (SELECT 1 FROM "filieres" AS f WHERE f."code" = c."filiereCode")
ORDER BY c."filiereCode", c."filiereLibelle"
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 3. Report des références
-- =====================================================================

-- Inscriptions : niveau de base + filière (sans écraser une filière déjà saisie).
UPDATE "inscriptions" AS i
SET "niveauId"  = c."niveauId",
    "filiereId" = COALESCE(i."filiereId", f."id")
FROM "_niveaux_combines" AS c
LEFT JOIN "filieres" AS f ON f."code" = c."filiereCode"
WHERE i."niveauId" = c."ancienId";

-- Ouvertures par année : le niveau de base est ouvert si au moins une
-- de ses anciennes variantes l'était.
INSERT INTO "niveau_annees" ("id", "niveauId", "anneeUniversitaireId", "actif")
SELECT gen_random_uuid()::text, c."niveauId", na."anneeUniversitaireId", bool_or(na."actif")
FROM "niveau_annees" AS na
JOIN "_niveaux_combines" AS c ON c."ancienId" = na."niveauId"
GROUP BY c."niveauId", na."anneeUniversitaireId"
ON CONFLICT ("niveauId", "anneeUniversitaireId")
DO UPDATE SET "actif" = "niveau_annees"."actif" OR EXCLUDED."actif";

DELETE FROM "niveau_annees" AS na
USING "_niveaux_combines" AS c
WHERE na."niveauId" = c."ancienId";

-- Catalogue de matières.
INSERT INTO "niveau_matieres" ("id", "niveauId", "matiereId")
SELECT gen_random_uuid()::text, c."niveauId", nm."matiereId"
FROM "niveau_matieres" AS nm
JOIN "_niveaux_combines" AS c ON c."ancienId" = nm."niveauId"
GROUP BY c."niveauId", nm."matiereId"
ON CONFLICT ("niveauId", "matiereId") DO NOTHING;

DELETE FROM "niveau_matieres" AS nm
USING "_niveaux_combines" AS c
WHERE nm."niveauId" = c."ancienId";

-- Règles de paiement : la scolarité dépend du niveau seul. Une règle du
-- niveau de base pour la même année et le même type prime ; sinon on garde
-- une seule des règles des variantes et on la rattache au niveau de base.
DELETE FROM "regles_paiement" AS r
USING "_niveaux_combines" AS c
WHERE r."niveauId" = c."ancienId"
  AND EXISTS (
    SELECT 1 FROM "regles_paiement" AS b
    WHERE b."niveauId" = c."niveauId"
      AND b."anneeUniversitaireId" = r."anneeUniversitaireId"
      AND b."type" IS NOT DISTINCT FROM r."type"
  );

DELETE FROM "regles_paiement" AS r
USING "_niveaux_combines" AS c
WHERE r."niveauId" = c."ancienId"
  AND r."id" <> (
    SELECT min(r2."id")
    FROM "regles_paiement" AS r2
    JOIN "_niveaux_combines" AS c2 ON c2."ancienId" = r2."niveauId"
    WHERE c2."niveauId" = c."niveauId"
      AND r2."anneeUniversitaireId" = r."anneeUniversitaireId"
      AND r2."type" IS NOT DISTINCT FROM r."type"
  );

UPDATE "regles_paiement" AS r
SET "niveauId" = c."niveauId"
FROM "_niveaux_combines" AS c
WHERE r."niveauId" = c."ancienId";

-- =====================================================================
-- 4. Suppression des niveaux combinés
-- =====================================================================

DELETE FROM "niveaux" AS n
USING "_niveaux_combines" AS c
WHERE n."id" = c."ancienId";

DROP TABLE "_niveaux_combines";
