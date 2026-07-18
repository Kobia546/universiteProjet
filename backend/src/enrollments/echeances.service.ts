import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EcheancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Recalcule le statut de chaque échéance d'une inscription en fonction
   * du cumul des paiements valides enregistrés sur cette inscription.
   * Approche : les échéances sont ordonnées, et le montant total payé est
   * "consommé" échéance par échéance dans l'ordre.
   *
   * Utilisé après tout paiement/annulation ET après toute modification
   * manuelle de l'échéancier (montant, date, ajout, suppression), puisque
   * les comptables peuvent librement ajuster les échéances.
   *
   * Fait aussi passer automatiquement l'inscription en "VALIDEE" dès que
   * tout est payé, et la fait revenir en "EN_COURS" si un paiement est
   * annulé après coup et qu'elle n'est plus soldée — sans jamais toucher
   * aux statuts ANNULEE ou TRANSFEREE, qui restent une décision manuelle.
   */
  async recalculer(inscriptionId: string) {
    const [echeances, paiementsValides, inscription] = await Promise.all([
      this.prisma.echeance.findMany({
        where: { inscriptionId },
        orderBy: { numeroEcheance: 'asc' },
      }),
      this.prisma.paiement.findMany({
        where: { inscriptionId, statut: 'VALIDE' },
      }),
      this.prisma.inscription.findUnique({ where: { id: inscriptionId } }),
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

    if (!inscription) return;

    const estSoldee = totalPaye >= Number(inscription.montantTotalDu);

    if (estSoldee && inscription.statut === 'EN_COURS') {
      await this.prisma.inscription.update({
        where: { id: inscriptionId },
        data: { statut: 'VALIDEE' },
      });
      await this.auditService.enregistrer({
        userId: paiementsValides[paiementsValides.length - 1]?.agentId ?? inscription.agentId,
        action: 'inscription_soldee',
        ressourceType: 'inscription',
        ressourceId: inscriptionId,
        details: { montantTotalDu: Number(inscription.montantTotalDu), totalPaye },
      });
    } else if (!estSoldee && inscription.statut === 'VALIDEE') {
      // Un paiement a été annulé après coup : l'inscription n'est plus
      // entièrement soldée, on revient à "en cours".
      await this.prisma.inscription.update({
        where: { id: inscriptionId },
        data: { statut: 'EN_COURS' },
      });
    }
  }
}
