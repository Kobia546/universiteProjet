import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';
import { OuvrirNiveauDto } from './dto/ouvrir-niveau.dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Filières ----

  createFiliere(dto: CreateFiliereDto) {
    return this.prisma.filiere.create({ data: dto });
  }

  findAllFilieres() {
    return this.prisma.filiere.findMany({
      include: { filiereNiveaux: { include: { niveau: true, anneeUniversitaire: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  async findOneFiliere(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { filiereNiveaux: { include: { niveau: true, anneeUniversitaire: true } } },
    });
    if (!filiere) throw new NotFoundException(`Filière ${id} introuvable`);
    return filiere;
  }

  async updateFiliere(id: string, dto: UpdateFiliereDto) {
    await this.findOneFiliere(id);
    return this.prisma.filiere.update({ where: { id }, data: dto });
  }

  async removeFiliere(id: string) {
    await this.findOneFiliere(id);
    return this.prisma.filiere.delete({ where: { id } });
  }

  // ---- Niveaux (référentiel fixe : L1, L2, L3, M1, M2) ----

  findAllNiveaux() {
    return this.prisma.niveau.findMany({ orderBy: { code: 'asc' } });
  }

  // ---- Ouverture d'un niveau pour une filière sur une année donnée ----

  ouvrirNiveau(dto: OuvrirNiveauDto) {
    return this.prisma.filiereNiveau.upsert({
      where: {
        filiereId_niveauId_anneeUniversitaireId: {
          filiereId: dto.filiereId,
          niveauId: dto.niveauId,
          anneeUniversitaireId: dto.anneeUniversitaireId,
        },
      },
      update: { actif: true },
      create: { ...dto, actif: true },
    });
  }

  fermerNiveau(id: string) {
    return this.prisma.filiereNiveau.update({
      where: { id },
      data: { actif: false },
    });
  }
}
