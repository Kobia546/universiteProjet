import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumeroInscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un numéro du type INS-2026-000045
   */
  async genererNumero(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.inscription.count({
      where: { numeroInscription: { startsWith: `INS-${annee}-` } },
    });
    const numero = String(count + 1).padStart(6, '0');
    return `INS-${annee}-${numero}`;
  }
}
