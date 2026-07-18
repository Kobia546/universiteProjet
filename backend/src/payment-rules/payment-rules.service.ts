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
      include: { filiere: true, anneeUniversitaire: true },
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
   * filière+type > filière seule > type seul > règle générale.
   */
  async resoudreRegleApplicable(params: {
    filiereId: string;
    type: TypeEtudiant;
    anneeUniversitaireId: string;
  }) {
    const { filiereId, type, anneeUniversitaireId } = params;

    const regles = await this.prisma.reglePaiement.findMany({
      where: {
        anneeUniversitaireId,
        OR: [
          { filiereId, type },
          { filiereId, type: null },
          { filiereId: null, type },
          { filiereId: null, type: null },
        ],
      },
    });

    const parSpecificite = (r: (typeof regles)[number]) => {
      if (r.filiereId && r.type) return 3;
      if (r.filiereId) return 2;
      if (r.type) return 1;
      return 0;
    };

    regles.sort((a, b) => parSpecificite(b) - parSpecificite(a));

    return regles[0] ?? null;
  }
}
