import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigurerCarnetDto } from './dto/configurer-carnet.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CarnetRecuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.carnetRecu.findMany({ orderBy: { annee: 'desc' } });
  }

  async configurer(dto: ConfigurerCarnetDto, agentId: string) {
    const carnet = await this.prisma.carnetRecu.upsert({
      where: { annee: dto.annee },
      update: {
        prefixe: dto.prefixe ?? undefined,
        prochainNumero: dto.prochainNumero,
      },
      create: {
        annee: dto.annee,
        prefixe: dto.prefixe ?? 'REC',
        prochainNumero: dto.prochainNumero,
      },
    });

    await this.auditService.enregistrer({
      userId: agentId,
      action: 'configuration_carnet_recu',
      ressourceType: 'carnet_recu',
      ressourceId: carnet.id,
      details: { annee: dto.annee, prochainNumero: dto.prochainNumero, prefixe: dto.prefixe },
    });

    return carnet;
  }
}
