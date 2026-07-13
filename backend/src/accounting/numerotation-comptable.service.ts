import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumerotationComptableService {
  constructor(private readonly prisma: PrismaService) {}

  /** Numéro de bordereau EP703, type BR-2026-000001 */
  async genererNumeroBordereau(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.ecritureRecette.count({
      where: { numeroBordereau: { startsWith: `BR-${annee}-` } },
    });
    return `BR-${annee}-${String(count + 1).padStart(6, '0')}`;
  }

  /** Numéro de chèque EP704, type CHQ-2026-000001 */
  async genererNumeroCheque(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.ecritureDepense.count({
      where: { numeroCheque: { startsWith: `CHQ-${annee}-` } },
    });
    return `CHQ-${annee}-${String(count + 1).padStart(6, '0')}`;
  }
}
