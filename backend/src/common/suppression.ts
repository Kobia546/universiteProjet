import { Prisma } from '@prisma/client';

/**
 * Suppression en cascade (dans une transaction) de paiements et de tout ce
 * qui en dépend : reçus puis paiements. L'écriture de recette comptable liée
 * n'est PAS supprimée (trace comptable) : elle est simplement détachée du
 * paiement (paiementId = null).
 */
export async function supprimerPaiementsTx(
  tx: Prisma.TransactionClient,
  paiementIds: string[],
) {
  if (paiementIds.length === 0) return;
  await tx.ecritureRecette.updateMany({
    where: { paiementId: { in: paiementIds } },
    data: { paiementId: null },
  });
  await tx.recu.deleteMany({ where: { paiementId: { in: paiementIds } } });
  await tx.paiement.deleteMany({ where: { id: { in: paiementIds } } });
}

/**
 * Suppression en cascade d'inscriptions : paiements (+ reçus), échéances,
 * puis inscriptions.
 */
export async function supprimerInscriptionsTx(
  tx: Prisma.TransactionClient,
  inscriptionIds: string[],
) {
  if (inscriptionIds.length === 0) return;
  const paiements = await tx.paiement.findMany({
    where: { inscriptionId: { in: inscriptionIds } },
    select: { id: true },
  });
  await supprimerPaiementsTx(
    tx,
    paiements.map((p) => p.id),
  );
  await tx.echeance.deleteMany({ where: { inscriptionId: { in: inscriptionIds } } });
  await tx.inscription.deleteMany({ where: { id: { in: inscriptionIds } } });
}
