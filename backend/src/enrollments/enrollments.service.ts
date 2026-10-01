import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentRulesService } from '../payment-rules/payment-rules.service';
import { CreateInscriptionDto } from './dto/create-inscription.dto';
import { NumeroInscriptionService } from './numero-inscription.service';
import { CreateEcheanceDto } from './dto/create-echeance.dto';
import { UpdateEcheanceDto } from './dto/update-echeance.dto';
import { EcheancesService } from './echeances.service';
import { AuditService } from '../audit/audit.service';
import { UpdateInscriptionDto } from './dto/update-inscription.dto';
import { supprimerInscriptionsTx } from '../common/suppression';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRulesService: PaymentRulesService,
    private readonly numeroInscriptionService: NumeroInscriptionService,
    private readonly echeancesService: EcheancesService,
    private readonly auditService: AuditService,
  ) {}

  private async verifierNiveauOuvert(niveauId: string, anneeUniversitaireId: string) {
    const ouverture = await this.prisma.niveauAnnee.findUnique({
      where: { niveauId_anneeUniversitaireId: { niveauId, anneeUniversitaireId } },
    });
    if (!ouverture || !ouverture.actif) {
      throw new BadRequestException("Ce niveau n'est pas ouvert pour cette année universitaire.");
    }
  }

  private async verifierFiliereActive(filiereId: string) {
    const filiere = await this.prisma.filiere.findUnique({ where: { id: filiereId } });
    if (!filiere) throw new NotFoundException('Filière introuvable');
    if (!filiere.actif) {
      throw new BadRequestException(`La filière « ${filiere.libelle} » n'est plus proposée.`);
    }
  }

  async create(dto: CreateInscriptionDto, agentId: string) {
    const { etudiantId, niveauId, filiereId, anneeUniversitaireId } = dto;

    const etudiant = await this.prisma.etudiant.findUnique({ where: { id: etudiantId } });
    if (!etudiant) throw new NotFoundException('Étudiant introuvable');

    // 1. Vérifier que le niveau est bien ouvert pour cette année
    await this.verifierNiveauOuvert(niveauId, anneeUniversitaireId);
    // ... et que la filière choisie existe et est active
    await this.verifierFiliereActive(filiereId);

    // 2. Résoudre la règle de paiement applicable (selon niveau + type d'étudiant)
    const regle = await this.paymentRulesService.resoudreRegleApplicable({
      niveauId,
      type: etudiant.type,
      anneeUniversitaireId,
    });
    if (!regle) {
      throw new BadRequestException(
        "Aucune règle de paiement n'est configurée pour ce niveau/type d'étudiant/année. " +
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

    // Date réelle d'inscription (celle du carnet papier) — distincte de
    // l'horodatage de saisie (`createdAt`, généré automatiquement et jamais
    // modifiable). Par défaut la date du jour si non précisée.
    const dateInscriptionReelle = dto.dateInscription ? new Date(dto.dateInscription) : new Date();

    // Le calcul des échéances reste basé sur le moment réel de la saisie
    // (et non la date du carnet, qui peut être dans le passé) pour éviter
    // de générer des échéances déjà "en retard" lors d'une saisie tardive.
    const maintenant = new Date();
    const echeancesData: {
      numeroEcheance: number;
      montantPrevu: number;
      dateLimite: Date;
    }[] = [
      { numeroEcheance: 1, montantPrevu: montantInscription, dateLimite: maintenant },
    ];

    if (nombreEcheancesRestantes > 0) {
      const montantParEcheance = Math.floor(montantRestant / nombreEcheancesRestantes);
      const dureeTotaleMs = annee.dateFin.getTime() - maintenant.getTime();

      for (let i = 1; i <= nombreEcheancesRestantes; i++) {
        const estDerniere = i === nombreEcheancesRestantes;
        const dateLimite = new Date(
          maintenant.getTime() + (dureeTotaleMs * i) / nombreEcheancesRestantes,
        );
        const montantPrevu = estDerniere
          ? montantRestant - montantParEcheance * (nombreEcheancesRestantes - 1)
          : montantParEcheance;

        echeancesData.push({ numeroEcheance: i + 1, montantPrevu, dateLimite });
      }
    }

    const numeroInscription = await this.numeroInscriptionService.genererNumero();

    // 4. Créer l'inscription + ses échéances
    return this.prisma.inscription.create({
      data: {
        numeroInscription,
        etudiantId,
        niveauId,
        filiereId,
        anneeUniversitaireId,
        montantTotalDu: montantTotal,
        dateInscription: dateInscriptionReelle,
        agentId,
        echeances: { create: echeancesData },
      },
      include: {
        echeances: true,
        etudiant: true,
        niveau: true,
        filiere: true,
        anneeUniversitaire: true,
      },
    });
  }

  /**
   * Corrige la date d'inscription (celle du carnet papier) après coup —
   * par exemple si le comptable s'est trompé ou l'a saisie approximativement.
   * `createdAt` (l'horodatage de saisie informatique) n'est jamais touché.
   */
  async modifierDateInscription(id: string, dateInscription: string, agentId: string) {
    const inscription = await this.prisma.inscription.findUnique({ where: { id } });
    if (!inscription) throw new NotFoundException(`Inscription ${id} introuvable`);

    const misAJour = await this.prisma.inscription.update({
      where: { id },
      data: { dateInscription: new Date(dateInscription) },
    });

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'modification_date_inscription',
      ressourceType: 'inscription',
      ressourceId: id,
      details: { ancienneDateInscription: inscription.dateInscription, dateInscription },
    });

    return misAJour;
  }

  async findAll(params: {
    anneeUniversitaireId?: string;
    niveauId?: string;
    filiereId?: string;
    statut?: string;
  }) {
    const { anneeUniversitaireId, niveauId, filiereId, statut } = params;
    const inscriptions = await this.prisma.inscription.findMany({
      where: {
        ...(anneeUniversitaireId ? { anneeUniversitaireId } : {}),
        ...(niveauId ? { niveauId } : {}),
        ...(filiereId ? { filiereId } : {}),
        ...(statut ? { statut: statut as any } : {}),
      },
      include: {
        etudiant: true,
        niveau: true,
        filiere: true,
        anneeUniversitaire: true,
        paiements: { where: { statut: 'VALIDE' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Solde calculé directement ici, pour l'afficher dans la liste sans
    // avoir à ouvrir chaque inscription.
    return inscriptions.map((i) => {
      const totalPaye = i.paiements.reduce((s, p) => s + Number(p.montant), 0);
      const resteAPayer = Math.max(Number(i.montantTotalDu) - totalPaye, 0);
      return { ...i, totalPaye, resteAPayer };
    });
  }

  async findOne(id: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
      include: {
        etudiant: true,
        niveau: true,
        filiere: true,
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

  /**
   * Correction administrateur : niveau, filière ou statut d'une inscription.
   * Le montant dû et l'échéancier ne sont PAS recalculés (ils peuvent déjà
   * avoir été ajustés / avoir reçu des paiements) : après un changement de
   * niveau, ajuster l'échéancier si besoin.
   */
  async modifier(id: string, dto: UpdateInscriptionDto, agentId: string) {
    const inscription = await this.prisma.inscription.findUnique({ where: { id } });
    if (!inscription) throw new NotFoundException(`Inscription ${id} introuvable`);

    if (dto.niveauId && dto.niveauId !== inscription.niveauId) {
      await this.verifierNiveauOuvert(dto.niveauId, inscription.anneeUniversitaireId);
    }
    if (dto.filiereId && dto.filiereId !== inscription.filiereId) {
      await this.verifierFiliereActive(dto.filiereId);
    }

    const misAJour = await this.prisma.inscription.update({
      where: { id },
      data: {
        ...(dto.niveauId ? { niveauId: dto.niveauId } : {}),
        ...(dto.filiereId ? { filiereId: dto.filiereId } : {}),
        ...(dto.statut ? { statut: dto.statut } : {}),
      },
      include: { niveau: true, filiere: true },
    });

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'modification_inscription',
      ressourceType: 'inscription',
      ressourceId: id,
      details: {
        avant: {
          niveauId: inscription.niveauId,
          filiereId: inscription.filiereId,
          statut: inscription.statut,
        },
        apres: { ...dto },
      },
    });
    return misAJour;
  }

  /** Suppression définitive (administrateur) : paiements, reçus et échéances inclus. */
  async remove(id: string, agentId: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
      include: { _count: { select: { paiements: true } } },
    });
    if (!inscription) throw new NotFoundException(`Inscription ${id} introuvable`);

    await this.prisma.$transaction((tx) => supprimerInscriptionsTx(tx, [id]));

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'suppression_inscription',
      ressourceType: 'inscription',
      ressourceId: id,
      details: {
        numeroInscription: inscription.numeroInscription,
        paiementsSupprimes: inscription._count.paiements,
      },
    });
    return { id };
  }
}
