-- AlterTable
-- sexe et dateNaissance deviennent optionnels : certains imports en masse
-- (historique papier) n'ont pas cette information à la saisie — à compléter
-- plus tard dans l'app. Sans effet si la colonne est déjà nullable.
ALTER TABLE "etudiants" ALTER COLUMN "sexe" DROP NOT NULL;
ALTER TABLE "etudiants" ALTER COLUMN "dateNaissance" DROP NOT NULL;
