import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnneeDto } from './dto/create-annee.dto';
import { UpdateAnneeDto } from './dto/update-annee.dto';

// Règles de paiement standards appliquées par défaut à toute nouvelle année
// universitaire, pour éviter de tout ressaisir à chaque rentrée — modifiables
// ensuite au cas par cas depuis la page "Règles de paiement".
const SCOLARITE_PAR_DEFAUT: Record<string, { etudiant: number; travailleur: number }> = {
  L1: { etudiant: 700000, travailleur: 800000 },
  L2: { etudiant: 800000, travailleur: 900000 },
  L3: { etudiant: 900000, travailleur: 1000000 },
  M1: { etudiant: 1000000, travailleur: 1100000 },
  M2: { etudiant: 1100000, travailleur: 1200000 },
};
const POURCENTAGE_INSCRIPTION_PAR_DEFAUT = 60;
const NOMBRE_ECHEANCES_PAR_DEFAUT = 3;

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnneeDto) {
    const niveaux = await this.prisma.niveau.findMany();

    return this.prisma.$transaction(async (tx) => {
      // Si la nouvelle année est marquée active, on désactive les autres
      if (dto.active) {
        await tx.anneeUniversitaire.updateMany({
          data: { active: false },
          where: { active: true },
        });
      }

      const annee = await tx.anneeUniversitaire.create({
        data: {
          libelle: dto.libelle,
          dateDebut: new Date(dto.dateDebut),
          dateFin: new Date(dto.dateFin),
          active: dto.active ?? false,
        },
      });

      // Tous les niveaux démarrent ouvertes sur la nouvelle année, avec
      // les règles de paiement standards déjà en place — l'utilisateur n'a
      // plus qu'à fermer/modifier celles qui changent, plutôt que de tout
      // reconfigurer manuellement à chaque rentrée.
      for (const niveau of niveaux) {
        await tx.niveauAnnee.create({
          data: { niveauId: niveau.id, anneeUniversitaireId: annee.id, actif: true },
        });

        const montants = SCOLARITE_PAR_DEFAUT[niveau.code];
        if (montants) {
          await tx.reglePaiement.createMany({
            data: [
              {
                niveauId: niveau.id,
                type: 'ETUDIANT',
                anneeUniversitaireId: annee.id,
                montantTotal: montants.etudiant,
                pourcentageInscription: POURCENTAGE_INSCRIPTION_PAR_DEFAUT,
                nombreEcheances: NOMBRE_ECHEANCES_PAR_DEFAUT,
              },
              {
                niveauId: niveau.id,
                type: 'TRAVAILLEUR',
                anneeUniversitaireId: annee.id,
                montantTotal: montants.travailleur,
                pourcentageInscription: POURCENTAGE_INSCRIPTION_PAR_DEFAUT,
                nombreEcheances: NOMBRE_ECHEANCES_PAR_DEFAUT,
              },
            ],
          });
        }
      }

      return annee;
    });
  }

  findAll() {
    return this.prisma.anneeUniversitaire.findMany({ orderBy: { dateDebut: 'desc' } });
  }

  async activer(id: string) {
    const annee = await this.prisma.anneeUniversitaire.findUnique({ where: { id } });
    if (!annee) throw new NotFoundException(`Année universitaire ${id} introuvable`);

    await this.prisma.anneeUniversitaire.updateMany({
      data: { active: false },
      where: { active: true },
    });

    return this.prisma.anneeUniversitaire.update({
      where: { id },
      data: { active: true },
    });
  }

  async update(id: string, dto: UpdateAnneeDto) {
    const annee = await this.prisma.anneeUniversitaire.findUnique({ where: { id } });
    if (!annee) throw new NotFoundException(`Année universitaire ${id} introuvable`);

    const debut = dto.dateDebut ? new Date(dto.dateDebut) : annee.dateDebut;
    const fin = dto.dateFin ? new Date(dto.dateFin) : annee.dateFin;
    if (fin <= debut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.active) {
        await tx.anneeUniversitaire.updateMany({
          data: { active: false },
          where: { active: true, id: { not: id } },
        });
      }
      return tx.anneeUniversitaire.update({
        where: { id },
        data: {
          ...(dto.libelle !== undefined ? { libelle: dto.libelle } : {}),
          dateDebut: debut,
          dateFin: fin,
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      });
    });
  }

  /**
   * Supprime une année sans aucune inscription (créée par erreur). Ses règles
   * de paiement et ouvertures de niveaux sont supprimées avec elle.
   */
  async remove(id: string) {
    const annee = await this.prisma.anneeUniversitaire.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } },
    });
    if (!annee) throw new NotFoundException(`Année universitaire ${id} introuvable`);
    if (annee._count.inscriptions > 0) {
      throw new BadRequestException(
        `Cette année compte ${annee._count.inscriptions} inscription(s) : elle ne peut pas être supprimée.`,
      );
    }
    await this.prisma.$transaction([
      this.prisma.reglePaiement.deleteMany({ where: { anneeUniversitaireId: id } }),
      this.prisma.niveauAnnee.deleteMany({ where: { anneeUniversitaireId: id } }),
      this.prisma.anneeUniversitaire.delete({ where: { id } }),
    ]);
    return { id };
  }
}
