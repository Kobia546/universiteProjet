import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeEtudiant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReglePaiementDto } from './dto/create-regle-paiement.dto';
import { UpdateReglePaiementDto } from './dto/update-regle-paiement.dto';

@Injectable()
export class PaymentRulesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateReglePaiementDto) {
    return this.prisma.reglePaiement.create({ data: dto });
  }

  findAll(anneeUniversitaireId?: string) {
    return this.prisma.reglePaiement.findMany({
      where: anneeUniversitaireId ? { anneeUniversitaireId } : {},
      include: { niveau: true, anneeUniversitaire: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateReglePaiementDto) {
    const regle = await this.prisma.reglePaiement.findUnique({ where: { id } });
    if (!regle) throw new NotFoundException(`Règle de paiement ${id} introuvable`);
    return this.prisma.reglePaiement.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const regle = await this.prisma.reglePaiement.findUnique({ where: { id } });
    if (!regle) throw new NotFoundException(`Règle de paiement ${id} introuvable`);
    return this.prisma.reglePaiement.delete({ where: { id } });
  }

  /**
   * Résout la règle de paiement la plus spécifique applicable : priorité
   * niveau+type > niveau seul > type seul > règle générale.
   */
  async resoudreRegleApplicable(params: {
    niveauId: string;
    type: TypeEtudiant;
    anneeUniversitaireId: string;
  }) {
    const { niveauId, type, anneeUniversitaireId } = params;

    const regles = await this.prisma.reglePaiement.findMany({
      where: {
        anneeUniversitaireId,
        OR: [
          { niveauId, type },
          { niveauId, type: null },
          { niveauId: null, type },
          { niveauId: null, type: null },
        ],
      },
    });

    const parSpecificite = (r: (typeof regles)[number]) => {
      if (r.niveauId && r.type) return 3;
      if (r.niveauId) return 2;
      if (r.type) return 1;
      return 0;
    };

    regles.sort((a, b) => parSpecificite(b) - parSpecificite(a));

    return regles[0] ?? null;
  }
}
