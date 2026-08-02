import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NumerotationComptableService } from './numerotation-comptable.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { CreateRecetteManuelleDto } from './dto/create-recette-manuelle.dto';
import { CreateOperationCaisseDto, TypeOperationCaisse } from './dto/create-operation-caisse.dto';
import type { Paiement } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numerotation: NumerotationComptableService,
    private readonly auditService: AuditService,
  ) {}

  // ---- EP703 : Recettes ----

  /**
   * Créée automatiquement à chaque paiement validé (voir PaymentsService).
   * Ne pas appeler directement pour un paiement — passe par PaymentsService.create().
   */
  async creerRecetteDepuisPaiement(paiement: Paiement, libelle: string, agentId: string) {
    const numeroBordereau = await this.numerotation.genererNumeroBordereau();
    return this.prisma.ecritureRecette.create({
      data: {
        numeroBordereau,
        libelle,
        montant: paiement.montant,
        paiementId: paiement.id,
        agentId,
      },
    });
  }

  /** Saisie manuelle d'une recette hors paiement étudiant (régularisation). */
  async creerRecetteManuelle(dto: CreateRecetteManuelleDto, agentId: string) {
    const numeroBordereau = await this.numerotation.genererNumeroBordereau();
    const recette = await this.prisma.ecritureRecette.create({
      data: {
        numeroBordereau,
        libelle: dto.libelle,
        requerant: dto.requerant,
        montant: dto.montant,
        date: dto.date ? new Date(dto.date) : undefined,
        pieceJustificativeUrl: dto.pieceJustificativeUrl,
        agentId,
      },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'create_manuelle',
      ressourceType: 'ep703_recette',
      ressourceId: recette.id,
      details: { montant: dto.montant, libelle: dto.libelle },
    });
    return recette;
  }

  findAllRecettes(params: { dateDebut?: string; dateFin?: string }) {
    const { dateDebut, dateFin } = params;
    return this.prisma.ecritureRecette.findMany({
      where: {
        ...(dateDebut || dateFin
          ? {
              date: {
                ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
                ...(dateFin ? { lte: new Date(dateFin) } : {}),
              },
            }
          : {}),
      },
      include: { agent: true, paiement: { include: { etudiant: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async contrePasserRecette(id: string, agentId: string) {
    const recette = await this.prisma.ecritureRecette.findUnique({ where: { id } });
    if (!recette) throw new NotFoundException(`Écriture recette ${id} introuvable`);
    if (recette.statut === 'CONTRE_PASSE') {
      throw new BadRequestException('Cette écriture est déjà contre-passée');
    }
    const misAJour = await this.prisma.ecritureRecette.update({
      where: { id },
      data: { statut: 'CONTRE_PASSE' },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'contre_passation',
      ressourceType: 'ep703_recette',
      ressourceId: id,
      details: { montant: Number(recette.montant) },
    });
    return misAJour;
  }

  // ---- EP704 : Dépenses ----

  async createDepense(dto: CreateDepenseDto, agentId: string) {
    const numeroCheque = await this.numerotation.genererNumeroCheque();
    const depense = await this.prisma.ecritureDepense.create({
      data: {
        numeroCheque,
        libelle: dto.libelle,
        requerant: dto.requerant,
        montant: dto.montant,
        date: dto.date ? new Date(dto.date) : undefined,
        justificatifUrl: dto.justificatifUrl,
        agentId,
      },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'create',
      ressourceType: 'ep704_depense',
      ressourceId: depense.id,
      details: { montant: dto.montant, libelle: dto.libelle },
    });
    return depense;
  }

  findAllDepenses(params: { dateDebut?: string; dateFin?: string }) {
    const { dateDebut, dateFin } = params;
    return this.prisma.ecritureDepense.findMany({
      where: {
        ...(dateDebut || dateFin
          ? {
              date: {
                ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
                ...(dateFin ? { lte: new Date(dateFin) } : {}),
              },
            }
          : {}),
      },
      include: { agent: true },
      orderBy: { date: 'desc' },
    });
  }

  async contrePasserDepense(id: string, agentId: string) {
    const depense = await this.prisma.ecritureDepense.findUnique({ where: { id } });
    if (!depense) throw new NotFoundException(`Écriture dépense ${id} introuvable`);
    if (depense.statut === 'CONTRE_PASSE') {
      throw new BadRequestException('Cette écriture est déjà contre-passée');
    }
    const misAJour = await this.prisma.ecritureDepense.update({
      where: { id },
      data: { statut: 'CONTRE_PASSE' },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'contre_passation',
      ressourceType: 'ep704_depense',
      ressourceId: id,
      details: { montant: Number(depense.montant) },
    });
    return misAJour;
  }

  // ---- Opération de caisse (Bon de caisse papier : entrée ou sortie) ----

  /**
   * Point d'entrée unique pour le formulaire "Opération de caisse", qui
   * reproduit le bon de caisse papier (Entrée/Sortie + Requérant + Objet +
   * Montant + Date). Une "Entrée" devient une recette (EP703), une
   * "Sortie" devient une dépense (EP704) — même logique de numérotation et
   * de traçabilité que les saisies déjà existantes.
   */
  async creerOperationCaisse(dto: CreateOperationCaisseDto, agentId: string) {
    if (dto.type === TypeOperationCaisse.ENTREE) {
      return this.creerRecetteManuelle(
        {
          libelle: dto.objet,
          requerant: dto.requerant,
          montant: dto.montant,
          date: dto.date,
        },
        agentId,
      );
    }

    return this.createDepense(
      {
        libelle: dto.objet,
        requerant: dto.requerant,
        montant: dto.montant,
        date: dto.date,
      },
      agentId,
    );
  }

  // ---- EP706 : Centralisateur (vue agrégée, pas de saisie manuelle) ----

  async getCentralisateur(params: { dateDebut?: string; dateFin?: string }) {
    const { dateDebut, dateFin } = params;
    const filtreDate =
      dateDebut || dateFin
        ? {
            ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
            ...(dateFin ? { lte: new Date(dateFin) } : {}),
          }
        : undefined;

    const [recettes, depenses] = await Promise.all([
      this.prisma.ecritureRecette.findMany({
        where: { statut: 'VALIDE', ...(filtreDate ? { date: filtreDate } : {}) },
      }),
      this.prisma.ecritureDepense.findMany({
        where: { statut: 'VALIDE', ...(filtreDate ? { date: filtreDate } : {}) },
      }),
    ]);

    const totalRecettes = recettes.reduce((somme, r) => somme + Number(r.montant), 0);
    const totalDepenses = depenses.reduce((somme, d) => somme + Number(d.montant), 0);

    return {
      totalRecettes,
      totalDepenses,
      solde: totalRecettes - totalDepenses,
      nombreOperations: recettes.length + depenses.length,
      periode: { dateDebut: dateDebut ?? null, dateFin: dateFin ?? null },
    };
  }
}
