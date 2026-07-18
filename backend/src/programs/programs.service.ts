import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { OuvrirFiliereDto } from './dto/ouvrir-filiere.dto';
import { RattacherMatiereDto } from './dto/rattacher-matiere.dto';

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Filières (référentiel fixe : L1, L2, L3, M1, M2) ----

  findAllFilieres() {
    return this.prisma.filiere.findMany({
      include: {
        anneesOuvertes: { include: { anneeUniversitaire: true } },
        matieres: { include: { matiere: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOneFiliere(id: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: {
        anneesOuvertes: { include: { anneeUniversitaire: true } },
        matieres: { include: { matiere: true } },
      },
    });
    if (!filiere) throw new NotFoundException(`Filière ${id} introuvable`);
    return filiere;
  }

  ouvrirFiliere(dto: OuvrirFiliereDto) {
    return this.prisma.filiereAnnee.upsert({
      where: {
        filiereId_anneeUniversitaireId: {
          filiereId: dto.filiereId,
          anneeUniversitaireId: dto.anneeUniversitaireId,
        },
      },
      update: { actif: true },
      create: { ...dto, actif: true },
    });
  }

  fermerFiliere(id: string) {
    return this.prisma.filiereAnnee.update({ where: { id }, data: { actif: false } });
  }

  // ---- Matières (catalogue informatif) ----

  createMatiere(dto: CreateMatiereDto) {
    return this.prisma.matiere.create({ data: dto });
  }

  findAllMatieres() {
    return this.prisma.matiere.findMany({
      include: { filieres: { include: { filiere: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  async updateMatiere(id: string, dto: UpdateMatiereDto) {
    const matiere = await this.prisma.matiere.findUnique({ where: { id } });
    if (!matiere) throw new NotFoundException(`Matière ${id} introuvable`);
    return this.prisma.matiere.update({ where: { id }, data: dto });
  }

  async removeMatiere(id: string) {
    const matiere = await this.prisma.matiere.findUnique({ where: { id } });
    if (!matiere) throw new NotFoundException(`Matière ${id} introuvable`);
    return this.prisma.matiere.delete({ where: { id } });
  }

  rattacherMatiere(dto: RattacherMatiereDto) {
    return this.prisma.filiereMatiere.upsert({
      where: {
        filiereId_matiereId: { filiereId: dto.filiereId, matiereId: dto.matiereId },
      },
      update: {},
      create: dto,
    });
  }

  async detacherMatiere(id: string) {
    const lien = await this.prisma.filiereMatiere.findUnique({ where: { id } });
    if (!lien) throw new NotFoundException(`Rattachement ${id} introuvable`);
    return this.prisma.filiereMatiere.delete({ where: { id } });
  }
}
