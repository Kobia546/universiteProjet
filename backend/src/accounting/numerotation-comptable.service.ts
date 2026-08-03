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

  /** Numéro d’opération EP704, type OP-2026-000001 */
  async genererNumeroOperation(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.ecritureDepense.count({
      where: { numeroOperation: { startsWith: `OP-${annee}-` } },
    });
    return `OP-${annee}-${String(count + 1).padStart(6, '0')}`;
  }
}
