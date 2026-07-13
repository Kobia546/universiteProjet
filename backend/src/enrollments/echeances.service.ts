import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EcheancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalcule le statut de chaque échéance d'une inscription en fonction
   * du cumul des paiements valides enregistrés sur cette inscription.
   * Approche : les échéances sont ordonnées, et le montant total payé est
   * "consommé" échéance par échéance dans l'ordre.
   *
   * Utilisé après tout paiement/annulation ET après toute modification
   * manuelle de l'échéancier (montant, date, ajout, suppression), puisque
   * les comptables peuvent librement ajuster les échéances.
   */
  async recalculer(inscriptionId: string) {
    const [echeances, paiementsValides] = await Promise.all([
      this.prisma.echeance.findMany({
        where: { inscriptionId },
        orderBy: { numeroEcheance: 'asc' },
      }),
      this.prisma.paiement.findMany({
        where: { inscriptionId, statut: 'VALIDE' },
      }),
    ]);

    const totalPaye = paiementsValides.reduce((somme, p) => somme + Number(p.montant), 0);
    const maintenant = new Date();

    let cumulDu = 0;
    const updates = echeances.map((echeance) => {
      cumulDu += Number(echeance.montantPrevu);
      let statut: 'A_PAYER' | 'PARTIEL' | 'SOLDE' | 'EN_RETARD';

      if (totalPaye >= cumulDu) {
        statut = 'SOLDE';
      } else if (totalPaye > cumulDu - Number(echeance.montantPrevu)) {
        statut = new Date(echeance.dateLimite) < maintenant ? 'EN_RETARD' : 'PARTIEL';
      } else {
        statut = new Date(echeance.dateLimite) < maintenant ? 'EN_RETARD' : 'A_PAYER';
      }

      return this.prisma.echeance.update({ where: { id: echeance.id }, data: { statut } });
    });

    await Promise.all(updates);
  }
}
