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

  async findAll(params: { etudiantId?: string; inscriptionId?: string; modePaiement?: string }) {
    const { etudiantId, inscriptionId, modePaiement } = params;
    const paiements = await this.prisma.paiement.findMany({
      where: {
        ...(etudiantId ? { etudiantId } : {}),
        ...(inscriptionId ? { inscriptionId } : {}),
        ...(modePaiement ? { modePaiement: modePaiement as any } : {}),
      },
      include: {
        etudiant: true,
        inscription: {
          include: { filiere: true, paiements: { where: { statut: 'VALIDE' } } },
        },
        recu: true,
        agent: true,
      },
      orderBy: { datePaiement: 'desc' },
    });

    // Reste à payer *actuel* sur l'inscription (pas seulement au moment de
    // ce paiement précis) — cohérent avec ce qui est affiché partout
    // ailleurs dans l'app (fiche étudiant, fiche inscription...).
    return paiements.map((p) => {
      const totalPayeInscription = p.inscription.paiements.reduce(
        (s, pp) => s + Number(pp.montant),
        0,
      );
      const resteAPayer = Math.max(Number(p.inscription.montantTotalDu) - totalPayeInscription, 0);
      return { ...p, resteAPayerInscription: resteAPayer };
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
            anneeUniversitaire: true,
            echeances: { orderBy: { numeroEcheance: 'asc' } },
            paiements: { where: { statut: 'VALIDE' }, orderBy: { datePaiement: 'asc' } },
          },
        },
        recu: true,
        recette: true,
        agent: true,
      },
    });
    if (!paiement) throw new NotFoundException('Paiement introuvable');

    // Est-ce que CE paiement précis est celui qui a fait basculer
    // l'inscription en "soldée" ? (utile pour l'afficher sur le reçu)
    let estPaiementSoldant = false;
    if (paiement.statut === 'VALIDE') {
      const montantTotalDu = Number(paiement.inscription.montantTotalDu);
      let cumul = 0;
      for (const p of paiement.inscription.paiements) {
        const cumulAvant = cumul;
        cumul += Number(p.montant);
        if (p.id === paiement.id && cumulAvant < montantTotalDu && cumul >= montantTotalDu) {
          estPaiementSoldant = true;
        }
      }
    }

    return { ...paiement, estPaiementSoldant };
  }
}
