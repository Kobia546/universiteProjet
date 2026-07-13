import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumeroRecuService {
  constructor(private readonly prisma: PrismaService) {}

  /** Numéro de reçu, type REC-2026-000123 */
  async genererNumero(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.recu.count({
      where: { numeroRecu: { startsWith: `REC-${annee}-` } },
    });
    return `REC-${annee}-${String(count + 1).padStart(6, '0')}`;
  }
}
