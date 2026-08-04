import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(anneeUniversitaireId?: string) {
    const maintenant = new Date();

    // Si aucune année n'est précisée, on prend l'année active par défaut —
    // sinon les statistiques mélangeraient toutes les années confondues.
    const anneeCiblee = anneeUniversitaireId
      ? await this.prisma.anneeUniversitaire.findUnique({ where: { id: anneeUniversitaireId } })
      : await this.prisma.anneeUniversitaire.findFirst({ where: { active: true } });

    const filtreAnnee = anneeCiblee ? { anneeUniversitaireId: anneeCiblee.id } : {};
    const anneeDebut = anneeCiblee ? new Date(anneeCiblee.dateDebut) : null;
    const anneeFin = anneeCiblee ? new Date(anneeCiblee.dateFin) : null;

    // Le mois utilisé pour les cartes Recettes/Dépenses doit toujours
    // appartenir à l'année universitaire sélectionnée — jamais un mois
    // extérieur à sa période. Exemple concret : si l'année active est
    // 2025-2026 (on est en août 2026) et qu'on sélectionne 2024-2025 (déjà
    // terminée, aucune donnée saisie), il ne faut PAS afficher les
    // données d'août 2026 (mois réel) sous prétexte qu'elles existent
    // ailleurs — il faut rester dans la période de 2024-2025, où il n'y a
    // effectivement rien, donc 0 partout.
    //
    // - Si la période de l'année sélectionnée couvre aujourd'hui → mois
    //   civil actuel (cas normal : l'année en cours).
    // - Sinon (année déjà terminée, ou pas encore commencée) → on prend le
    //   premier mois de cette année-là, qui reste dans sa période.
    let debutMois: Date;
    let finMois: Date;

    if (anneeDebut && anneeFin && maintenant >= anneeDebut && maintenant <= anneeFin) {
      debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
      finMois = new Date(
        Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 0, 23, 59, 59),
      );
    } else if (anneeDebut) {
      debutMois = new Date(Date.UTC(anneeDebut.getUTCFullYear(), anneeDebut.getUTCMonth(), 1));
      finMois = new Date(
        Date.UTC(anneeDebut.getUTCFullYear(), anneeDebut.getUTCMonth() + 1, 0, 23, 59, 59),
      );
    } else {
      debutMois = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1));
      finMois = new Date(
        Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 0, 23, 59, 59),
      );
    }

    const debutHistorique = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - 5, 1));

    // Une recette peut être rattachée à un paiement d'étudiant (donc à une
    // inscription, donc à une année universitaire), OU saisie manuellement
    // sans lien avec un paiement précis (subvention, don...). Dans ce
    // second cas, impossible de savoir à quelle année elle appartient — on
    // la garde donc dans toutes les périodes où sa date tombe, plutôt que
    // de la faire disparaître complètement dès qu'une année est choisie.
    const filtreRecettesAnnee = anneeCiblee
      ? {
          OR: [
            { paiementId: null },
            { paiement: { inscription: { anneeUniversitaireId: anneeCiblee.id } } },
          ],
        }
      : {};

    const [
      inscriptionsAnnee,
      recettesDuMois,
      depensesDuMois,
      echeancesAnnee,
      dernieresPaiements,
      dernieresDepenses,
      recettes6Mois,
      depenses6Mois,
    ] = await Promise.all([
      this.prisma.inscription.findMany({
        where: { statut: { not: 'ANNULEE' }, ...filtreAnnee },
        include: { filiere: true, etudiant: true, paiements: { where: { statut: 'VALIDE' } } },
      }),
      this.prisma.ecritureRecette.findMany({
        where: {
          statut: 'VALIDE',
          date: { gte: debutMois, lte: finMois },
          ...filtreRecettesAnnee,
        },
      }),
      this.prisma.ecritureDepense.findMany({
        where: {
          statut: 'VALIDE',
          // Une dépense n'a aucun lien possible avec une année universitaire
          // (achat de fournitures, frais de fonctionnement...) — seule la
          // date la situe dans le temps, donc pas de filtre d'année ici.
          date: { gte: debutMois, lte: finMois },
        },
      }),
      this.prisma.echeance.findMany({
        where: {
          ...(anneeCiblee ? { inscription: { anneeUniversitaireId: anneeCiblee.id } } : {}),
        },
      }),
      this.prisma.paiement.findMany({
        where: {
          statut: 'VALIDE',
          ...(anneeCiblee ? { inscription: { anneeUniversitaireId: anneeCiblee.id } } : {}),
        },
        include: { etudiant: true },
        orderBy: { datePaiement: 'desc' },
        take: 8,
      }),
      this.prisma.ecritureDepense.findMany({
        where: {
          statut: 'VALIDE',
        },
        orderBy: { date: 'desc' },
        take: 8,
      }),
      this.prisma.ecritureRecette.findMany({
        where: {
          statut: 'VALIDE',
          date: { gte: debutHistorique },
        },
      }),
      this.prisma.ecritureDepense.findMany({
        where: {
          statut: 'VALIDE',
          date: { gte: debutHistorique, lte: finMois },
        },
      }),
    ]);

    const revenusDuMois = recettesDuMois.reduce<number>((s, r) => s + Number(r.montant), 0);
    const depensesTotalDuMois = depensesDuMois.reduce<number>((s, d) => s + Number(d.montant), 0);

    // Universitaires distincts inscrits cette année (un étudiant = 1 seule
    // fois même s'il a plusieurs inscriptions, en théorie rare).
    const universitairesUniques = new Map<string, (typeof inscriptionsAnnee)[number]['etudiant']>();
    for (const i of inscriptionsAnnee) {
      universitairesUniques.set(i.etudiantId, i.etudiant);
    }
    const totalUniversitaires = universitairesUniques.size;

    const repartitionMap = new Map<string, number>();
    for (const inscription of inscriptionsAnnee) {
      const libelle = inscription.filiere.libelle;
      repartitionMap.set(libelle, (repartitionMap.get(libelle) ?? 0) + 1);
    }
    const repartitionParFiliere = Array.from(repartitionMap.entries()).map(([filiere, total]) => ({
      filiere,
      total,
    }));

    const typeMap = new Map<string, number>();
    for (const universitaire of universitairesUniques.values()) {
      typeMap.set(universitaire.type, (typeMap.get(universitaire.type) ?? 0) + 1);
    }
    const repartitionParType = Array.from(typeMap.entries()).map(([type, total]) => ({
      type,
      total,
    }));

    // Dernières opérations = paiements ET dépenses mêlés, triés par date,
    // pas seulement les paiements (les dépenses n'apparaissaient pas avant).
    const dernieresOperations = [
      ...dernieresPaiements.map((p) => ({
        id: p.id,
        type: 'recette' as const,
        libelle: `${p.motif} — ${p.etudiant.prenom} ${p.etudiant.nom}`,
        montant: Number(p.montant),
        date: p.datePaiement,
      })),
      ...dernieresDepenses.map((d) => ({
        id: d.id,
        type: 'depense' as const,
        libelle: d.libelle,
        montant: Number(d.montant),
        date: d.date,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    // Taux de règlement des inscriptions = part du montant total dû déjà
    // encaissée, sur l'année ciblée (remplace le montant brut "impayé").
    const totalDuAnnee = inscriptionsAnnee.reduce((s, i) => s + Number(i.montantTotalDu), 0);
    const totalEncaisseAnnee = inscriptionsAnnee.reduce(
      (s, i) => s + i.paiements.reduce((s2, p) => s2 + Number(p.montant), 0),
      0,
    );
    const tauxReglementInscriptions =
      totalDuAnnee > 0 ? Math.min((totalEncaisseAnnee / totalDuAnnee) * 100, 100) : 0;

    // Taux de règlement de la scolarité = part des échéances soldées sur
    // le total des échéances de l'année (remplace "échéances en attente").
    const echeancesSoldees = echeancesAnnee.filter((e) => e.statut === 'SOLDE').length;
    const tauxReglementScolarite =
      echeancesAnnee.length > 0 ? (echeancesSoldees / echeancesAnnee.length) * 100 : 0;

    // Évolution recettes/dépenses des 6 derniers mois — reste sur un
    // calendrier civil (les registres comptables EP703/EP704 sont datés
    // au jour le jour, pas rattachés à une année universitaire).
    const evolution6Mois: { mois: string; recettes: number; depenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const debut = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const fin = new Date(maintenant.getFullYear(), maintenant.getMonth() - i + 1, 0, 23, 59, 59);
      const recettes = recettes6Mois
        .filter((r) => r.date >= debut && r.date <= fin)
        .reduce((s, r) => s + Number(r.montant), 0);
      const depenses = depenses6Mois
        .filter((d) => d.date >= debut && d.date <= fin)
        .reduce((s, d) => s + Number(d.montant), 0);
      evolution6Mois.push({
        mois: debut.toLocaleDateString('fr-FR', { month: 'short' }),
        recettes,
        depenses,
      });
    }

    return {
      anneeUniversitaire: anneeCiblee
        ? { id: anneeCiblee.id, libelle: anneeCiblee.libelle }
        : null,
      // Mois effectivement utilisé pour les cartes Recettes/Dépenses,
      // au format "YYYY-MM" — permet au frontend d'afficher le bon
      // libellé (ex: "Septembre 2023") quand ce n'est pas le mois actuel.
      moisAffiche: `${debutMois.getUTCFullYear()}-${String(debutMois.getUTCMonth() + 1).padStart(2, '0')}`,
      totalUniversitaires,
      nouveauxInscrits: inscriptionsAnnee.length,
      revenusDuMois,
      depensesDuMois: depensesTotalDuMois,
      solde: revenusDuMois - depensesTotalDuMois,
      tauxReglementInscriptions,
      tauxReglementScolarite,
      repartitionParFiliere,
      repartitionParType,
      evolution6Mois,
      dernieresOperations,
    };
  }
}
