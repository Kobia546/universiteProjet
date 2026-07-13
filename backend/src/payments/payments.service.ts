import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { NumeroRecuService } from './numero-recu.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { AuditService } from '../audit/audit.service';
import { EcheancesService } from '../enrollments/echeances.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
    private readonly numeroRecuService: NumeroRecuService,
    private readonly auditService: AuditService,
    private readonly echeancesService: EcheancesService,
  ) {}

  async create(dto: CreatePaiementDto, agentId: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id: dto.inscriptionId },
      include: { etudiant: true },
    });
    if (!inscription) throw new NotFoundException('Inscription introuvable');
    if (inscription.statut === 'ANNULEE') {
      throw new BadRequestException("Impossible d'enregistrer un paiement sur une inscription annulée");
    }

    // 1. Créer le paiement
    const paiement = await this.prisma.paiement.create({
      data: {
        referenceUnique: randomUUID(),
        inscriptionId: dto.inscriptionId,
        etudiantId: inscription.etudiantId,
        montant: dto.montant,
        motif: dto.motif,
        modePaiement: dto.modePaiement,
        agentId,
      },
    });

    // 2. Générer le reçu (obligatoire pour tout paiement)
    const numeroRecu = await this.numeroRecuService.genererNumero();
    await this.prisma.recu.create({
      data: { numeroRecu, paiementId: paiement.id },
    });

    // 3. Générer l'écriture comptable EP703 correspondante
    const libelle = `Paiement ${dto.motif} — ${inscription.etudiant.prenom} ${inscription.etudiant.nom} (${inscription.etudiant.matricule})`;
    await this.accountingService.creerRecetteDepuisPaiement(paiement, libelle, agentId);

    // 4. Recalculer le statut des échéances de l'inscription
    await this.echeancesService.recalculer(dto.inscriptionId);

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'create',
      ressourceType: 'paiement',
      ressourceId: paiement.id,
      details: { montant: dto.montant, motif: dto.motif, inscriptionId: dto.inscriptionId },
    });

    return this.findOne(paiement.id);
  }

  async annuler(id: string, agentId: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: { recette: true },
    });
    if (!paiement) throw new NotFoundException('Paiement introuvable');
    if (paiement.statut === 'ANNULE') {
      throw new BadRequestException('Ce paiement est déjà annulé');
    }

    await this.prisma.paiement.update({ where: { id }, data: { statut: 'ANNULE' } });

    if (paiement.recette) {
      await this.accountingService.contrePasserRecette(paiement.recette.id, agentId);
    }

    await this.echeancesService.recalculer(paiement.inscriptionId);

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'annulation',
      ressourceType: 'paiement',
      ressourceId: id,
      details: { montant: Number(paiement.montant) },
    });

    return this.findOne(id);
  }

  findAll(params: { etudiantId?: string; inscriptionId?: string; modePaiement?: string }) {
    const { etudiantId, inscriptionId, modePaiement } = params;
    return this.prisma.paiement.findMany({
      where: {
        ...(etudiantId ? { etudiantId } : {}),
        ...(inscriptionId ? { inscriptionId } : {}),
        ...(modePaiement ? { modePaiement: modePaiement as any } : {}),
      },
      include: {
        etudiant: true,
        inscription: { include: { filiere: true, niveau: true } },
        recu: true,
        agent: true,
      },
      orderBy: { datePaiement: 'desc' },
    });
  }

  async findOne(id: string) {
    const paiement = await this.prisma.paiement.findUnique({
      where: { id },
      include: {
        etudiant: true,
        inscription: {
          include: {
            filiere: true,
            niveau: true,
            anneeUniversitaire: true,
            echeances: { orderBy: { numeroEcheance: 'asc' } },
            paiements: { where: { statut: 'VALIDE' } },
          },
        },
        recu: true,
        recette: true,
        agent: true,
      },
    });
    if (!paiement) throw new NotFoundException('Paiement introuvable');
    return paiement;
  }
}
