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

  async findAll(params: { recherche?: string; filiereId?: string; anneeUniversitaireId?: string }) {
    const { recherche, filiereId, anneeUniversitaireId } = params;

    const etudiants = await this.prisma.etudiant.findMany({
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
          filiereId
            ? { inscriptions: { some: { filiereId } } }
            : {},
          anneeUniversitaireId
            ? { inscriptions: { some: { anneeUniversitaireId } } }
            : {},
        ],
      },
      include: {
        inscriptions: {
          where: { statut: { not: 'ANNULEE' } },
          include: { paiements: { where: { statut: 'VALIDE' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Statut de paiement global (toutes inscriptions actives confondues),
    // affiché directement dans la liste pour éviter d'avoir à ouvrir
    // chaque fiche pour savoir qui a soldé ou non.
    return etudiants.map((e) => {
      const { inscriptions, ...reste } = e;

      // Date d'inscription (carnet) correspondant à l'année filtrée, si
      // une année a été précisée — sinon non applicable (un étudiant peut
      // avoir plusieurs inscriptions sur plusieurs années).
      const inscriptionAnnee = anneeUniversitaireId
        ? inscriptions.find((i) => i.anneeUniversitaireId === anneeUniversitaireId)
        : undefined;

      if (inscriptions.length === 0) {
        return {
          ...reste,
          statutPaiement: 'AUCUNE_INSCRIPTION' as const,
          resteAPayer: 0,
          dateInscription: inscriptionAnnee?.dateInscription ?? null,
        };
      }
      const totalDu = inscriptions.reduce((s, i) => s + Number(i.montantTotalDu), 0);
      const totalPaye = inscriptions.reduce(
        (s, i) => s + i.paiements.reduce((s2, p) => s2 + Number(p.montant), 0),
        0,
      );
      const resteAPayer = totalDu - totalPaye;
      return {
        ...reste,
        statutPaiement: (resteAPayer <= 0 ? 'SOLDE' : 'DOIT') as 'SOLDE' | 'DOIT',
        resteAPayer: Math.max(resteAPayer, 0),
        dateInscription: inscriptionAnnee?.dateInscription ?? null,
      };
    });
  }

  async findOne(id: string) {
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { id },
      include: {
        inscriptions: {
          include: {
            filiere: true,
            anneeUniversitaire: true,
            paiements: { where: { statut: 'VALIDE' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
          include: {
            inscription: { include: { filiere: true, anneeUniversitaire: true } },
          },
        },
      },
    });

    if (!etudiant) {
      throw new NotFoundException(`Étudiant ${id} introuvable`);
    }

    // Calcule le reste à payer pour chaque inscription individuellement.
    const inscriptionsAvecSolde = etudiant.inscriptions.map((i) => {
      const totalPaye = i.paiements.reduce((s, p) => s + Number(p.montant), 0);
      const resteAPayer = Number(i.montantTotalDu) - totalPaye;
      return { ...i, totalPaye, resteAPayer: Math.max(resteAPayer, 0) };
    });

    return { ...etudiant, inscriptions: inscriptionsAvecSolde };
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

  /**
   * Liste des étudiants qui doivent encore de l'argent, ou qui ont tout
   * soldé pour une année universitaire donnée (par défaut l'année active)
   * — comparé sur cette seule année pour ne pas mélanger les années entre
   * elles dans le calcul du solde.
   */
  async findParStatutPaiement(statut: 'doit' | 'solde', anneeUniversitaireId?: string) {
    const anneeCiblee = anneeUniversitaireId
      ? { id: anneeUniversitaireId }
      : await this.prisma.anneeUniversitaire.findFirst({ where: { active: true } });

    const filtreAnnee = anneeCiblee ? { anneeUniversitaireId: anneeCiblee.id } : {};

    const etudiants = await this.prisma.etudiant.findMany({
      where: { inscriptions: { some: { statut: { not: 'ANNULEE' }, ...filtreAnnee } } },
      include: {
        inscriptions: {
          where: { statut: { not: 'ANNULEE' }, ...filtreAnnee },
          include: {
            filiere: true,
            anneeUniversitaire: true,
            paiements: { where: { statut: 'VALIDE' } },
          },
        },
      },
    });

    const resultats = etudiants
      .filter((e) => e.inscriptions.length > 0)
      .map((e) => {
        const totalDu = e.inscriptions.reduce((s, i) => s + Number(i.montantTotalDu), 0);
        const totalPaye = e.inscriptions.reduce(
          (s, i) => s + i.paiements.reduce((s2, p) => s2 + Number(p.montant), 0),
          0,
        );
        return {
          id: e.id,
          matricule: e.matricule,
          nom: e.nom,
          prenom: e.prenom,
          telephone: e.telephone,
          inscriptions: e.inscriptions.map((i) => ({
            filiere: i.filiere.code,
            anneeUniversitaire: i.anneeUniversitaire.libelle,
          })),
          totalDu,
          totalPaye,
          resteAPayer: totalDu - totalPaye,
        };
      })
      .filter((e) => (statut === 'solde' ? e.resteAPayer <= 0 : e.resteAPayer > 0));

    return resultats;
  }
}
