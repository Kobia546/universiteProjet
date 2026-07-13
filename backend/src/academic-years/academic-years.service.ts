import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnneeDto } from './dto/create-annee.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnneeDto) {
    // Si la nouvelle année est marquée active, on désactive les autres
    if (dto.active) {
      await this.prisma.anneeUniversitaire.updateMany({
        data: { active: false },
        where: { active: true },
      });
    }
    return this.prisma.anneeUniversitaire.create({
      data: {
        libelle: dto.libelle,
        dateDebut: new Date(dto.dateDebut),
        dateFin: new Date(dto.dateFin),
        active: dto.active ?? false,
      },
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
}
