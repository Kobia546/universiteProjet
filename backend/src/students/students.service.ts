import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtudiantDto } from './dto/create-etudiant.dto';
import { UpdateEtudiantDto } from './dto/update-etudiant.dto';
import { MatriculeService } from './matricule.service';
import { AuditService } from '../audit/audit.service';
import { supprimerInscriptionsTx, supprimerPaiementsTx } from '../common/suppression';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matriculeService: MatriculeService,
    private readonly audit: AuditService,
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

  async findAll(params: {
    recherche?: string;
    niveauId?: string;
    filiereId?: string;
    anneeUniversitaireId?: string;
  }) {
    const { recherche, niveauId, filiereId, anneeUniversitaireId } = params;

    // La recherche texte porte sur nom/prénom/matricule/téléphone. En plus,
    // si le texte saisi ressemble à une date (jj/mm/aaaa, jj-mm-aaaa ou
    // aaaa-mm-jj), on élargit la recherche à la date de naissance du jour
    // correspondant — pratique pour retrouver quelqu'un via son numéro de
    // téléphone ou sa date de naissance plutôt que son seul matricule.
    const dateRecherchee = recherche ? this.parseDateRecherche(recherche) : null;

    const etudiants = await this.prisma.etudiant.findMany({
      where: {
        AND: [
          recherche
            ? {
                OR: [
                  { nom: { contains: recherche, mode: 'insensitive' } },
                  { prenom: { contains: recherche, mode: 'insensitive' } },
                  { matricule: { contains: recherche, mode: 'insensitive' } },
                  { telephone: { contains: recherche, mode: 'insensitive' } },
                  ...(dateRecherchee
                    ? [
                        {
                          dateNaissance: {
                            gte: dateRecherchee.debut,
                            lt: dateRecherchee.fin,
                          },
                        },
                      ]
                    : []),
                ],
              }
            : {},
          // Les filtres niveau / filière / année portent sur UNE MÊME
          // inscription (un étudiant L1 DA en 2024 puis L2 DH en 2025 ne
          // doit pas apparaître pour « L1 DH »).
          niveauId || filiereId || anneeUniversitaireId
            ? {
                inscriptions: {
                  some: {
                    ...(niveauId ? { niveauId } : {}),
                    ...(filiereId ? { filiereId } : {}),
                    ...(anneeUniversitaireId ? { anneeUniversitaireId } : {}),
                  },
                },
              }
            : {},
        ],
      },
      include: {
        inscriptions: {
          where: { statut: { not: 'ANNULEE' } },
          include: {
            niveau: true,
            filiere: true,
            paiements: { where: { statut: 'VALIDE' } },
          },
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

      // Programmes (niveau + filière) à afficher : ceux de l'année filtrée,
      // sinon toutes les inscriptions actives.
      const programmes = (
        anneeUniversitaireId
          ? inscriptions.filter((i) => i.anneeUniversitaireId === anneeUniversitaireId)
          : inscriptions
      ).map((i) => ({
        niveau: { code: i.niveau.code, libelle: i.niveau.libelle },
        filiere: i.filiere ? { code: i.filiere.code, libelle: i.filiere.libelle } : null,
      }));

      if (inscriptions.length === 0) {
        return {
          ...reste,
          programmes,
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
        programmes,
        statutPaiement: (resteAPayer <= 0 ? 'SOLDE' : 'DOIT') as 'SOLDE' | 'DOIT',
        resteAPayer: Math.max(resteAPayer, 0),
        dateInscription: inscriptionAnnee?.dateInscription ?? null,
      };
    });
  }

  /**
   * Tente d'interpréter le texte de recherche comme une date de naissance
   * (formats acceptés : jj/mm/aaaa, jj-mm-aaaa, aaaa-mm-jj). Retourne la
   * plage [début, fin) du jour correspondant, ou null si ça ne ressemble
   * pas à une date.
   */
  private parseDateRecherche(texte: string): { debut: Date; fin: Date } | null {
    const texteNettoye = texte.trim();

    let jour: number, mois: number, annee: number;

    const matchJjMmAaaa = texteNettoye.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    const matchAaaaMmJj = texteNettoye.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (matchJjMmAaaa) {
      [, jour, mois, annee] = matchJjMmAaaa.map(Number) as unknown as [string, number, number, number];
    } else if (matchAaaaMmJj) {
      [, annee, mois, jour] = matchAaaaMmJj.map(Number) as unknown as [string, number, number, number];
    } else {
      return null;
    }

    const debut = new Date(Date.UTC(annee, mois - 1, jour));
    if (Number.isNaN(debut.getTime())) return null;
    const fin = new Date(Date.UTC(annee, mois - 1, jour + 1));
    return { debut, fin };
  }

  async findOne(id: string) {
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { id },
      include: {
        inscriptions: {
          include: {
            niveau: true,
            filiere: true,
            anneeUniversitaire: true,
            paiements: { where: { statut: 'VALIDE' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        paiements: {
          orderBy: { datePaiement: 'desc' },
          include: {
            inscription: { include: { niveau: true, filiere: true, anneeUniversitaire: true } },
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

  /**
   * Suppression définitive (administrateur) d'un étudiant et de tout son
   * dossier : inscriptions, échéances, paiements et reçus.
   */
  async remove(id: string, agentId: string) {
    const etudiant = await this.prisma.etudiant.findUnique({
      where: { id },
      include: {
        inscriptions: { select: { id: true } },
        paiements: { select: { id: true } },
      },
    });
    if (!etudiant) throw new NotFoundException(`Étudiant ${id} introuvable`);

    await this.prisma.$transaction(async (tx) => {
      await supprimerPaiementsTx(
        tx,
        etudiant.paiements.map((p) => p.id),
      );
      await supprimerInscriptionsTx(
        tx,
        etudiant.inscriptions.map((i) => i.id),
      );
      await tx.etudiant.delete({ where: { id } });
    });

    await this.audit.enregistrer({
      userId: agentId,
      action: 'suppression_etudiant',
      ressourceType: 'etudiant',
      ressourceId: id,
      details: {
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        inscriptionsSupprimees: etudiant.inscriptions.length,
        paiementsSupprimes: etudiant.paiements.length,
      },
    });
    return { id };
  }

  /**
   * Liste des étudiants qui doivent encore de l'argent, ou qui ont tout
   * soldé pour une année universitaire donnée (par défaut l'année active)
   * — comparé sur cette seule année pour ne pas mélanger les années entre
   * elles dans le calcul du solde.
   */
  async findParStatutPaiement(
    statut: 'doit' | 'solde',
    anneeUniversitaireId?: string,
    niveauId?: string,
    filiereId?: string,
  ) {
    const anneeCiblee = anneeUniversitaireId
      ? { id: anneeUniversitaireId }
      : await this.prisma.anneeUniversitaire.findFirst({ where: { active: true } });

    const filtreAnnee = {
      ...(anneeCiblee ? { anneeUniversitaireId: anneeCiblee.id } : {}),
      ...(niveauId ? { niveauId } : {}),
      ...(filiereId ? { filiereId } : {}),
    };

    const etudiants = await this.prisma.etudiant.findMany({
      where: { inscriptions: { some: { statut: { not: 'ANNULEE' }, ...filtreAnnee } } },
      include: {
        inscriptions: {
          where: { statut: { not: 'ANNULEE' }, ...filtreAnnee },
          include: {
            niveau: true,
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
            niveau: i.niveau.code,
            filiere: i.filiere?.code ?? null,
            filiereLibelle: i.filiere?.libelle ?? null,
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
