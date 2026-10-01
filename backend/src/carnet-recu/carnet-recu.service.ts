import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarnetDto } from './dto/create-carnet.dto';
import { UpdateCarnetDto } from './dto/update-carnet.dto';
import { AjouterExclusionsDto } from './dto/ajouter-exclusions.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarnetRecuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Liste des carnets avec leurs statistiques : total de numéros, utilisés
   * (reçus émis), exclus (arrachés/supprimés), restants et prochain numéro
   * utilisable.
   */
  async findAll() {
    const carnets = await this.prisma.carnetRecu.findMany({
      orderBy: { numeroDebut: 'asc' },
      include: {
        exclusions: { orderBy: { numero: 'asc' } },
        recus: { select: { numeroRecu: true } },
      },
    });

    return carnets.map(({ recus, ...carnet }) => {
      const total = carnet.numeroFin - carnet.numeroDebut + 1;
      const utilises = new Set(
        recus.map((r) => Number(r.numeroRecu)).filter((n) => Number.isInteger(n)),
      );
      const exclus = new Set(carnet.exclusions.map((e) => e.numero));
      let prochainNumero: number | null = null;
      for (let n = carnet.numeroDebut; n <= carnet.numeroFin; n++) {
        if (!utilises.has(n) && !exclus.has(n)) {
          prochainNumero = n;
          break;
        }
      }
      return {
        ...carnet,
        total,
        nbUtilises: utilises.size,
        nbExclus: exclus.size,
        nbRestants: Math.max(0, total - utilises.size - exclus.size),
        prochainNumero,
      };
    });
  }

  private async trouver(id: string) {
    const carnet = await this.prisma.carnetRecu.findUnique({
      where: { id },
      include: { exclusions: true, recus: { select: { numeroRecu: true } } },
    });
    if (!carnet) throw new NotFoundException(`Carnet ${id} introuvable`);
    return carnet;
  }

  private async verifierChevauchement(debut: number, fin: number, ignoreId?: string) {
    const chevauchement = await this.prisma.carnetRecu.findFirst({
      where: {
        actif: true,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        numeroDebut: { lte: fin },
        numeroFin: { gte: debut },
      },
    });
    if (chevauchement) {
      throw new BadRequestException(
        `Cette plage chevauche un carnet déjà configuré (${chevauchement.numeroDebut}-${chevauchement.numeroFin}).`,
      );
    }
  }

  async create(dto: CreateCarnetDto, agentId: string) {
    if (dto.numeroFin < dto.numeroDebut) {
      throw new BadRequestException(
        'Le numéro de fin doit être supérieur ou égal au numéro de début.',
      );
    }
    // Empêche deux plages qui se chevauchent (source de confusion garantie).
    await this.verifierChevauchement(dto.numeroDebut, dto.numeroFin);

    const carnet = await this.prisma.carnetRecu.create({ data: dto });

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'creation_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: carnet.id,
      details: { numeroDebut: dto.numeroDebut, numeroFin: dto.numeroFin },
    });

    return carnet;
  }

  /**
   * Corrige la plage d'un carnet (erreur de saisie à la création). Refusé si
   * la nouvelle plage laisserait un reçu déjà émis ou un numéro exclu en
   * dehors du carnet.
   */
  async update(id: string, dto: UpdateCarnetDto, agentId: string) {
    const carnet = await this.trouver(id);
    const debut = dto.numeroDebut ?? carnet.numeroDebut;
    const fin = dto.numeroFin ?? carnet.numeroFin;
    if (fin < debut) {
      throw new BadRequestException(
        'Le numéro de fin doit être supérieur ou égal au numéro de début.',
      );
    }

    const horsPlage = (n: number) => n < debut || n > fin;
    const recuHorsPlage = carnet.recus.find((r) => horsPlage(Number(r.numeroRecu)));
    if (recuHorsPlage) {
      throw new BadRequestException(
        `Le reçu n°${recuHorsPlage.numeroRecu} a déjà été émis : la plage ne peut pas l'exclure.`,
      );
    }
    const exclusHorsPlage = carnet.exclusions.find((e) => horsPlage(e.numero));
    if (exclusHorsPlage) {
      throw new BadRequestException(
        `Le numéro ${exclusHorsPlage.numero} est déclaré supprimé : retirez-le d'abord de la liste avant de réduire la plage.`,
      );
    }
    if (carnet.actif) await this.verifierChevauchement(debut, fin, id);

    const misAJour = await this.prisma.carnetRecu.update({
      where: { id },
      data: { numeroDebut: debut, numeroFin: fin },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'modification_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: id,
      details: { avant: [carnet.numeroDebut, carnet.numeroFin], apres: [debut, fin] },
    });
    return misAJour;
  }

  async fermer(id: string, agentId: string) {
    await this.trouver(id);
    const misAJour = await this.prisma.carnetRecu.update({
      where: { id },
      data: { actif: false },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'fermeture_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: id,
    });
    return misAJour;
  }

  async rouvrir(id: string, agentId: string) {
    const carnet = await this.trouver(id);
    await this.verifierChevauchement(carnet.numeroDebut, carnet.numeroFin, id);
    const misAJour = await this.prisma.carnetRecu.update({
      where: { id },
      data: { actif: true },
    });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'reouverture_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: id,
    });
    return misAJour;
  }

  /** Suppression d'un carnet : possible uniquement si aucun reçu n'en dépend. */
  async remove(id: string, agentId: string) {
    const carnet = await this.trouver(id);
    if (carnet.recus.length > 0) {
      throw new BadRequestException(
        `${carnet.recus.length} reçu(s) ont été émis sur ce carnet : il ne peut pas être supprimé (fermez-le à la place).`,
      );
    }
    await this.prisma.carnetRecu.delete({ where: { id } }); // exclusions en cascade
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'suppression_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: id,
      details: { numeroDebut: carnet.numeroDebut, numeroFin: carnet.numeroFin },
    });
    return { id };
  }

  /**
   * Déclare des numéros physiquement arrachés / supprimés du carnet : ils ne
   * pourront plus être utilisés pour un paiement. Opération atomique : si un
   * seul numéro est invalide (hors plage, déjà utilisé), rien n'est enregistré.
   */
  async ajouterExclusions(id: string, dto: AjouterExclusionsDto, agentId: string) {
    const carnet = await this.trouver(id);
    const numeros = [...new Set(dto.numeros)];

    const horsPlage = numeros.filter((n) => n < carnet.numeroDebut || n > carnet.numeroFin);
    if (horsPlage.length > 0) {
      throw new BadRequestException(
        `Numéro(s) hors du carnet ${carnet.numeroDebut}-${carnet.numeroFin} : ${horsPlage.slice(0, 10).join(', ')}.`,
      );
    }
    const utilises = new Set(carnet.recus.map((r) => Number(r.numeroRecu)));
    const dejaUtilises = numeros.filter((n) => utilises.has(n));
    if (dejaUtilises.length > 0) {
      throw new BadRequestException(
        `Numéro(s) déjà utilisé(s) par un reçu émis : ${dejaUtilises.slice(0, 10).join(', ')}.`,
      );
    }

    const motif = dto.motif?.trim() || null;
    const resultat = await this.prisma.numeroCarnetExclu.createMany({
      data: numeros.map((numero) => ({ carnetRecuId: id, numero, motif })),
      skipDuplicates: true,
    });

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'declaration_numeros_supprimes',
      ressourceType: 'carnet_recu',
      ressourceId: id,
      details: { numeros, motif, ajoutes: resultat.count },
    });
    return { ajoutes: resultat.count, dejaDeclares: numeros.length - resultat.count };
  }

  /** Annule la déclaration d'un numéro supprimé (le numéro redevient utilisable). */
  async retirerExclusion(carnetId: string, exclusionId: string, agentId: string) {
    const exclusion = await this.prisma.numeroCarnetExclu.findFirst({
      where: { id: exclusionId, carnetRecuId: carnetId },
    });
    if (!exclusion) throw new NotFoundException('Numéro supprimé introuvable sur ce carnet.');
    await this.prisma.numeroCarnetExclu.delete({ where: { id: exclusionId } });
    await this.auditService.enregistrer({
      userId: agentId,
      action: 'retrait_numero_supprime',
      ressourceType: 'carnet_recu',
      ressourceId: carnetId,
      details: { numero: exclusion.numero },
    });
    return { id: exclusionId };
  }

  /**
   * Vérifie qu'un numéro de reçu appartient bien à une plage de carnet
   * active configurée, qu'il n'a pas été déclaré supprimé/arraché et qu'il
   * n'a pas déjà été utilisé. Lève une erreur explicite sinon.
   */
  async validerNumero(numero: number) {
    const carnet = await this.prisma.carnetRecu.findFirst({
      where: { actif: true, numeroDebut: { lte: numero }, numeroFin: { gte: numero } },
    });
    if (!carnet) {
      throw new BadRequestException(
        `Le numéro de reçu ${numero} n'appartient à aucun carnet configuré. Vérifie le numéro ou configure d'abord la plage correspondante dans Paramètres → Carnets de reçu.`,
      );
    }

    const exclu = await this.prisma.numeroCarnetExclu.findUnique({
      where: { carnetRecuId_numero: { carnetRecuId: carnet.id, numero } },
    });
    if (exclu) {
      throw new BadRequestException(
        `Le numéro de reçu ${numero} a été déclaré supprimé/arraché du carnet : il ne peut pas être utilisé.`,
      );
    }

    const dejaUtilise = await this.prisma.recu.findUnique({
      where: { numeroRecu: String(numero) },
    });
    if (dejaUtilise) {
      throw new BadRequestException(`Le numéro de reçu ${numero} a déjà été utilisé.`);
    }

    return carnet;
  }
}
