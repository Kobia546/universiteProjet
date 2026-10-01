import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { estDoublon, estEncoreReference } from '../common/prisma-errors';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';
import { CreateFiliereDto } from './dto/create-filiere.dto';
import { UpdateFiliereDto } from './dto/update-filiere.dto';
import { CreateMatiereDto } from './dto/create-matiere.dto';
import { UpdateMatiereDto } from './dto/update-matiere.dto';
import { OuvrirNiveauDto } from './dto/ouvrir-niveau.dto';
import { RattacherMatiereDto } from './dto/rattacher-matiere.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------
  // Niveaux (L1, L2, L3, M1, M2)
  // ---------------------------------------------------------------

  findAllNiveaux() {
    return this.prisma.niveau.findMany({
      include: {
        anneesOuvertes: { include: { anneeUniversitaire: true } },
        matieres: { include: { matiere: true } },
        _count: { select: { inscriptions: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOneNiveau(id: string) {
    const niveau = await this.prisma.niveau.findUnique({
      where: { id },
      include: {
        anneesOuvertes: { include: { anneeUniversitaire: true } },
        matieres: { include: { matiere: true } },
      },
    });
    if (!niveau) throw new NotFoundException(`Niveau ${id} introuvable`);
    return niveau;
  }

  async createNiveau(dto: CreateNiveauDto, agentId: string) {
    try {
      const niveau = await this.prisma.niveau.create({ data: dto });
      await this.audit.enregistrer({
        userId: agentId,
        action: 'CREATE_NIVEAU',
        ressourceType: 'Niveau',
        ressourceId: niveau.id,
        details: { code: niveau.code, libelle: niveau.libelle },
      });
      return niveau;
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`Le niveau "${dto.code}" existe déjà`);
      throw e;
    }
  }

  async updateNiveau(id: string, dto: UpdateNiveauDto, agentId: string) {
    await this.findOneNiveau(id);
    try {
      const niveau = await this.prisma.niveau.update({ where: { id }, data: dto });
      await this.audit.enregistrer({
        userId: agentId,
        action: 'UPDATE_NIVEAU',
        ressourceType: 'Niveau',
        ressourceId: id,
        details: { ...dto },
      });
      return niveau;
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`Le niveau "${dto.code}" existe déjà`);
      throw e;
    }
  }

  async removeNiveau(id: string, agentId: string) {
    const niveau = await this.prisma.niveau.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } },
    });
    if (!niveau) throw new NotFoundException(`Niveau ${id} introuvable`);
    if (niveau._count.inscriptions > 0) {
      throw new BadRequestException(
        `Ce niveau compte ${niveau._count.inscriptions} inscription(s) : il ne peut pas être supprimé.`,
      );
    }
    try {
      await this.prisma.$transaction([
        this.prisma.niveauAnnee.deleteMany({ where: { niveauId: id } }),
        this.prisma.niveauMatiere.deleteMany({ where: { niveauId: id } }),
        this.prisma.reglePaiement.deleteMany({ where: { niveauId: id } }),
        this.prisma.niveau.delete({ where: { id } }),
      ]);
    } catch (e) {
      if (estEncoreReference(e)) {
        throw new BadRequestException('Ce niveau est encore utilisé et ne peut pas être supprimé.');
      }
      throw e;
    }
    await this.audit.enregistrer({
      userId: agentId,
      action: 'DELETE_NIVEAU',
      ressourceType: 'Niveau',
      ressourceId: id,
      details: { code: niveau.code, libelle: niveau.libelle },
    });
    return { id };
  }

  async ouvrirNiveau(dto: OuvrirNiveauDto) {
    return this.prisma.niveauAnnee.upsert({
      where: {
        niveauId_anneeUniversitaireId: {
          niveauId: dto.niveauId,
          anneeUniversitaireId: dto.anneeUniversitaireId,
        },
      },
      update: { actif: true },
      create: { ...dto, actif: true },
    });
  }

  async fermerOuverture(id: string) {
    const o = await this.prisma.niveauAnnee.findUnique({ where: { id } });
    if (!o) throw new NotFoundException(`Ouverture ${id} introuvable`);
    return this.prisma.niveauAnnee.update({ where: { id }, data: { actif: false } });
  }

  // ---------------------------------------------------------------
  // Filières (spécialités)
  // ---------------------------------------------------------------

  findAllFilieres(actifsSeulement = false) {
    return this.prisma.filiere.findMany({
      where: actifsSeulement ? { actif: true } : undefined,
      include: { _count: { select: { inscriptions: true } } },
      orderBy: { libelle: 'asc' },
    });
  }

  async createFiliere(dto: CreateFiliereDto, agentId: string) {
    try {
      const filiere = await this.prisma.filiere.create({ data: dto });
      await this.audit.enregistrer({
        userId: agentId,
        action: 'CREATE_FILIERE',
        ressourceType: 'Filiere',
        ressourceId: filiere.id,
        details: { code: filiere.code, libelle: filiere.libelle },
      });
      return filiere;
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`La filière "${dto.code}" existe déjà`);
      throw e;
    }
  }

  async updateFiliere(id: string, dto: UpdateFiliereDto, agentId: string) {
    const existante = await this.prisma.filiere.findUnique({ where: { id } });
    if (!existante) throw new NotFoundException(`Filière ${id} introuvable`);
    try {
      const filiere = await this.prisma.filiere.update({ where: { id }, data: dto });
      await this.audit.enregistrer({
        userId: agentId,
        action: 'UPDATE_FILIERE',
        ressourceType: 'Filiere',
        ressourceId: id,
        details: { ...dto },
      });
      return filiere;
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`La filière "${dto.code}" existe déjà`);
      throw e;
    }
  }

  async removeFiliere(id: string, agentId: string) {
    const filiere = await this.prisma.filiere.findUnique({
      where: { id },
      include: { _count: { select: { inscriptions: true } } },
    });
    if (!filiere) throw new NotFoundException(`Filière ${id} introuvable`);
    if (filiere._count.inscriptions > 0) {
      throw new BadRequestException(
        `Cette filière compte ${filiere._count.inscriptions} inscription(s) : désactivez-la plutôt que de la supprimer.`,
      );
    }
    await this.prisma.filiere.delete({ where: { id } });
    await this.audit.enregistrer({
      userId: agentId,
      action: 'DELETE_FILIERE',
      ressourceType: 'Filiere',
      ressourceId: id,
      details: { code: filiere.code, libelle: filiere.libelle },
    });
    return { id };
  }

  // ---------------------------------------------------------------
  // Matières (catalogue informatif)
  // ---------------------------------------------------------------

  async createMatiere(dto: CreateMatiereDto) {
    try {
      return await this.prisma.matiere.create({ data: dto });
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`Le code matière "${dto.code}" existe déjà`);
      throw e;
    }
  }

  findAllMatieres() {
    return this.prisma.matiere.findMany({
      include: { niveaux: { include: { niveau: true } } },
      orderBy: { nom: 'asc' },
    });
  }

  async updateMatiere(id: string, dto: UpdateMatiereDto) {
    const matiere = await this.prisma.matiere.findUnique({ where: { id } });
    if (!matiere) throw new NotFoundException(`Matière ${id} introuvable`);
    try {
      return await this.prisma.matiere.update({ where: { id }, data: dto });
    } catch (e) {
      if (estDoublon(e)) throw new ConflictException(`Le code matière "${dto.code}" existe déjà`);
      throw e;
    }
  }

  async removeMatiere(id: string) {
    const matiere = await this.prisma.matiere.findUnique({ where: { id } });
    if (!matiere) throw new NotFoundException(`Matière ${id} introuvable`);
    await this.prisma.$transaction([
      this.prisma.niveauMatiere.deleteMany({ where: { matiereId: id } }),
      this.prisma.matiere.delete({ where: { id } }),
    ]);
    return { id };
  }

  rattacherMatiere(dto: RattacherMatiereDto) {
    return this.prisma.niveauMatiere.upsert({
      where: {
        niveauId_matiereId: { niveauId: dto.niveauId, matiereId: dto.matiereId },
      },
      update: {},
      create: dto,
    });
  }

  async detacherMatiere(id: string) {
    const lien = await this.prisma.niveauMatiere.findUnique({ where: { id } });
    if (!lien) throw new NotFoundException(`Rattachement ${id} introuvable`);
    return this.prisma.niveauMatiere.delete({ where: { id } });
  }
}
