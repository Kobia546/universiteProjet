import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarnetDto } from './dto/create-carnet.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarnetRecuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.carnetRecu.findMany({ orderBy: { numeroDebut: 'asc' } });
  }

  async create(dto: CreateCarnetDto, agentId: string) {
    if (dto.numeroFin < dto.numeroDebut) {
      throw new BadRequestException(
        'Le numéro de fin doit être supérieur ou égal au numéro de début.',
      );
    }

    // Empêche deux plages qui se chevauchent (source de confusion garantie).
    const chevauchement = await this.prisma.carnetRecu.findFirst({
      where: {
        actif: true,
        numeroDebut: { lte: dto.numeroFin },
        numeroFin: { gte: dto.numeroDebut },
      },
    });
    if (chevauchement) {
      throw new BadRequestException(
        `Cette plage chevauche un carnet déjà configuré (${chevauchement.numeroDebut}-${chevauchement.numeroFin}).`,
      );
    }

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

  async fermer(id: string, agentId: string) {
    const carnet = await this.prisma.carnetRecu.findUnique({ where: { id } });
    if (!carnet) throw new NotFoundException(`Carnet ${id} introuvable`);

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

  /**
   * Vérifie qu'un numéro de reçu appartient bien à une plage de carnet
   * active configurée, et qu'il n'a pas déjà été utilisé. Lève une erreur
   * explicite sinon — c'est ce qui évite les numéros inventés ou mal tapés.
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

    const dejaUtilise = await this.prisma.recu.findUnique({
      where: { numeroRecu: String(numero) },
    });
    if (dejaUtilise) {
      throw new BadRequestException(`Le numéro de reçu ${numero} a déjà été utilisé.`);
    }

    return carnet;
  }
}
