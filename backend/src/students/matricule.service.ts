import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatriculeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un matricule du type ETU-2026-000123
   * basé sur l'année en cours et un compteur séquentiel.
   */
  async genererMatricule(): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.prisma.etudiant.count({
      where: {
        matricule: { startsWith: `ETU-${annee}-` },
      },
    });
    const numero = String(count + 1).padStart(6, '0');
    return `ETU-${annee}-${numero}`;
  }
}
