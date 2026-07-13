import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import { UpdateEtudiantDto } from './dto/update-etudiant.dto';
import { MatriculeService } from './matricule.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matriculeService: MatriculeService,
  ) {}

  async create(dto: CreateEtudiantDto) {
    const matricule = await this.matriculeService.genererMatricule();
    return this.prisma.etudiant.create({
      data: {
        ...dto,
        matricule,
        dateNaissance: new Date(dto.dateNaissance),
      },
    });
  }

  async findAll(params: { recherche?: string; filiereId?: string; niveauId?: string }) {
    const { recherche, filiereId, niveauId } = params;

    return this.prisma.etudiant.findMany({
      where: {
        AND: [
          recherche
            ? {
                OR: [
                  { nom: { contains: recherche, mode: 'insensitive' } },
                  { prenom: { contains: recherche, mode: 'insensitive' } },
                  { matricule: { contains: recherche, mode: 'insensitive' } },
                ],
              }
            : {},
          filiereId || niveauId
            ? {
                inscriptions: {
                  some: {
                    ...(filiereId ? { filiereId } : {}),
                    ...(niveauId ? { niveauId } : {}),
                  },
                },
              }
            : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { id },
      include: {
        inscriptions: {
          include: { filiere: true, niveau: true, anneeUniversitaire: true },
          orderBy: { createdAt: 'desc' },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
        },
      },
    });

    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${id} introuvable`);
    }

    return etudiant;
  }

  async update(id: string, dto: UpdateEtudiantDto) {
    await this.findOne(id);
    return this.prisma.etudiant.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dateNaissance ? { dateNaissance: new Date(dto.dateNaissance) } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.etudiant.delete({ where: { id } });
  }
}
