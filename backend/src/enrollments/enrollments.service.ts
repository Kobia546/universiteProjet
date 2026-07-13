import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentRulesService } from '../payment-rules/payment-rules.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { NumeroInscriptionService } from './numero-inscription.service';
import { CreateEcheanceDto } from './dto/create-echeance.dto';
import { UpdateEcheanceDto } from './dto/update-echeance.dto';
import { EcheancesService } from './echeances.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRulesService: PaymentRulesService,
    private readonly numeroInscriptionService: NumeroInscriptionService,
    private readonly echeancesService: EcheancesService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateInscriptionDto, agentId: string) {
    const { etudiantId, filiereId, niveauId, anneeUniversitaireId } = dto;

    // 1. Vérifier que le niveau est bien ouvert pour cette filière/année
    const filiereNiveau = await this.prisma.filiereNiveau.findUnique({
      where: {
        filiereId_niveauId_anneeUniversitaireId: { filiereId, niveauId, anneeUniversitaireId },
      },
    });
    if (!filiereNiveau || !filiereNiveau.actif) {
      throw new BadRequestException(
        "Ce niveau n'est pas ouvert pour cette filière sur cette année universitaire.",
      );
    }

    // 2. Résoudre la règle de paiement applicable
    const regle = await this.paymentRulesService.resoudreRegleApplicable({
      filiereId,
      niveauId,
      anneeUniversitaireId,
    });
    if (!regle) {
      throw new BadRequestException(
        "Aucune règle de paiement n'est configurée pour cette filière/niveau/année. " +
          'Configurez-en une dans Paramètres avant de créer une inscription.',
      );
    }

    const annee = await this.prisma.anneeUniversitaire.findUnique({
      where: { id: anneeUniversitaireId },
    });
    if (!annee) throw new NotFoundException('Année universitaire introuvable');

    // 3. Calculer l'échéancier
    const montantTotal = Number(regle.montantTotal);
    const montantInscription = Math.round((montantTotal * regle.pourcentageInscription) / 100);
    const montantRestant = montantTotal - montantInscription;
    const nombreEcheancesRestantes = Math.max(regle.nombreEcheances - 1, 0);

    const dateInscription = new Date();
    const echeancesData: {
      numeroEcheance: number;
      montantPrevu: number;
      dateLimite: Date;
    }[] = [
      { numeroEcheance: 1, montantPrevu: montantInscription, dateLimite: dateInscription },
    ];

    if (nombreEcheancesRestantes > 0) {
      const montantParEcheance = Math.floor(montantRestant / nombreEcheancesRestantes);
      const dureeTotaleMs = annee.dateFin.getTime() - dateInscription.getTime();

      for (let i = 1; i <= nombreEcheancesRestantes; i++) {
        const estDerniere = i === nombreEcheancesRestantes;
        // Répartit les échéances restantes uniformément jusqu'à la fin de l'année universitaire
        const dateLimite = new Date(
          dateInscription.getTime() + (dureeTotaleMs * i) / nombreEcheancesRestantes,
        );
        // La dernière échéance absorbe l'arrondi pour que le total soit exact
        const montantPrevu = estDerniere
          ? montantRestant - montantParEcheance * (nombreEcheancesRestantes - 1)
          : montantParEcheance;

        echeancesData.push({ numeroEcheance: i + 1, montantPrevu, dateLimite });
      }
    }

    const numeroInscription = await this.numeroInscriptionService.genererNumero();

    // 4. Créer l'inscription + ses échéances en une seule transaction
    return this.prisma.inscription.create({
      data: {
        numeroInscription,
        etudiantId,
        filiereId,
        niveauId,
        anneeUniversitaireId,
        montantTotalDu: montantTotal,
        agentId,
        echeances: { create: echeancesData },
      },
      include: {
        echeances: true,
        etudiant: true,
        filiere: true,
        niveau: true,
        anneeUniversitaire: true,
      },
    });
  }

  findAll(params: { anneeUniversitaireId?: string; filiereId?: string; statut?: string }) {
    const { anneeUniversitaireId, filiereId, statut } = params;
    return this.prisma.inscription.findMany({
      where: {
        ...(anneeUniversitaireId ? { anneeUniversitaireId } : {}),
        ...(filiereId ? { filiereId } : {}),
        ...(statut ? { statut: statut as any } : {}),
      },
      include: { etudiant: true, filiere: true, niveau: true, anneeUniversitaire: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
      include: {
        etudiant: true,
        filiere: true,
        niveau: true,
        anneeUniversitaire: true,
        echeances: { orderBy: { numeroEcheance: 'asc' } },
        paiements: { orderBy: { datePaiement: 'desc' } },
      },
    });
    if (!inscription) throw new NotFoundException(`Inscription ${id} introuvable`);
    return inscription;
  }

  /**
   * Recalcule montantTotalDu = somme des échéances actuelles, puis
   * recalcule le statut de chaque échéance. À appeler après tout ajout,
   * modification ou suppression manuelle d'une échéance, pour que le
   * "reste à payer" affiché partout reste cohérent avec l'échéancier réel.
   */
  private async resynchroniserMontantTotal(inscriptionId: string) {
    const echeances = await this.prisma.echeance.findMany({ where: { inscriptionId } });
    const montantTotalDu = echeances.reduce((somme, e) => somme + Number(e.montantPrevu), 0);
    await this.prisma.inscription.update({
      where: { id: inscriptionId },
      data: { montantTotalDu },
    });
    await this.echeancesService.recalculer(inscriptionId);
  }

  async ajouterEcheance(inscriptionId: string, dto: CreateEcheanceDto, agentId: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: { echeances: true },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable');
    if (inscription.statut === 'ANNULEE') {
      throw new BadRequestException("Impossible de modifier l'échéancier d'une inscription annulée");
    }

    const prochainNumero =
      inscription.echeances.reduce((max, e) => Math.max(max, e.numeroEcheance), 0) + 1;

    const echeance = await this.prisma.echeance.create({
      data: {
        inscriptionId,
        numeroEcheance: prochainNumero,
        montantPrevu: dto.montantPrevu,
        dateLimite: new Date(dto.dateLimite),
      },
    });

    await this.resynchroniserMontantTotal(inscriptionId);

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'ajout_echeance',
      ressourceType: 'inscription',
      ressourceId: inscriptionId,
      details: { montantPrevu: dto.montantPrevu, dateLimite: dto.dateLimite },
    });

    return echeance;
  }

  async modifierEcheance(
    inscriptionId: string,
    echeanceId: string,
    dto: UpdateEcheanceDto,
    agentId: string,
  ) {
    const echeance = await this.prisma.echeance.findUnique({ where: { id: echeanceId } });
    if (!echeance || echeance.inscriptionId !== inscriptionId) {
      throw new NotFoundException('Échéance introuvable pour cette inscription');
    }

    const misAJour = await this.prisma.echeance.update({
      where: { id: echeanceId },
      data: {
        ...(dto.montantPrevu !== undefined ? { montantPrevu: dto.montantPrevu } : {}),
        ...(dto.dateLimite ? { dateLimite: new Date(dto.dateLimite) } : {}),
      },
    });

    await this.resynchroniserMontantTotal(inscriptionId);

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'modification_echeance',
      ressourceType: 'echeance',
      ressourceId: echeanceId,
      details: { ...dto },
    });

    return misAJour;
  }

  async supprimerEcheance(inscriptionId: string, echeanceId: string, agentId: string) {
    const echeance = await this.prisma.echeance.findUnique({ where: { id: echeanceId } });
    if (!echeance || echeance.inscriptionId !== inscriptionId) {
      throw new NotFoundException('Échéance introuvable pour cette inscription');
    }

    await this.prisma.echeance.delete({ where: { id: echeanceId } });
    await this.resynchroniserMontantTotal(inscriptionId);

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'suppression_echeance',
      ressourceType: 'echeance',
      ressourceId: echeanceId,
      details: { montantPrevu: Number(echeance.montantPrevu) },
    });

    return { supprime: true };
  }
}
