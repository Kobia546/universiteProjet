import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalEtudiants,
      nouveauxInscrits,
      recettesDuMois,
      depensesDuMois,
      echeancesEnAttente,
      inscriptions,
      dernieresPaiements,
    ] = await Promise.all([
      this.prisma.etudiant.count(),
      this.prisma.inscription.count({
        where: { dateInscription: { gte: debutMois, lte: finMois } },
      }),
      this.prisma.ecritureRecette.findMany({
        where: { statut: 'VALIDE', date: { gte: debutMois, lte: finMois } },
      }),
      this.prisma.ecritureDepense.findMany({
        where: { statut: 'VALIDE', date: { gte: debutMois, lte: finMois } },
      }),
      this.prisma.echeance.aggregate({
        where: { statut: { in: ['A_PAYER', 'PARTIEL', 'EN_RETARD'] } },
        _count: true,
        _sum: { montantPrevu: true },
      }),
      this.prisma.inscription.findMany({
        include: { filiere: true },
        where: { statut: { not: 'ANNULEE' } },
      }),
      this.prisma.paiement.findMany({
        where: { statut: 'VALIDE' },
        include: { etudiant: true },
        orderBy: { datePaiement: 'desc' },
        take: 8,
      }),
    ]);

    const revenusDuMois = recettesDuMois.reduce((s, r) => s + Number(r.montant), 0);
    const depensesTotalDuMois = depensesDuMois.reduce((s, d) => s + Number(d.montant), 0);

    const repartitionMap = new Map<string, number>();
    for (const inscription of inscriptions) {
      const nom = inscription.filiere.nom;
      repartitionMap.set(nom, (repartitionMap.get(nom) ?? 0) + 1);
    }
    const repartitionParFiliere = Array.from(repartitionMap.entries()).map(([filiere, total]) => ({
      filiere,
      total,
    }));

    const dernieresOperations = dernieresPaiements.map((p) => ({
      id: p.id,
      type: 'paiement' as const,
      libelle: `${p.motif} — ${p.etudiant.prenom} ${p.etudiant.nom}`,
      montant: Number(p.montant),
      date: p.datePaiement,
    }));

    return {
      totalEtudiants,
      nouveauxInscrits,
      revenusDuMois,
      depensesDuMois: depensesTotalDuMois,
      solde: revenusDuMois - depensesTotalDuMois,
      paiementsEnAttente: {
        nombre: echeancesEnAttente._count,
        montant: Number(echeancesEnAttente._sum.montantPrevu ?? 0),
      },
      repartitionParFiliere,
      dernieresOperations,
    };
  }
}
