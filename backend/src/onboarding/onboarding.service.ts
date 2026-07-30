import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Crée (ou réutilise) l'universitaire, son inscription, et (si fourni)
   * son premier paiement, en une seule opération côté interface.
   *
   * Deux cas :
   * - `etudiantId` fourni → universitaire déjà existant (ex: réinscription
   *   l'année suivante), on ne fait qu'ajouter l'inscription/le paiement.
   * - `etudiantId` absent → on crée d'abord la fiche à partir des champs
   *   fournis (nom, prénom, etc.).
   *
   * NB : ce n'est pas une transaction SQL unique (chaque étape utilise son
   * propre service métier avec sa propre logique). Si le paiement échoue
   * après la création de l'inscription, celle-ci reste enregistrée —
   * l'agent peut alors enregistrer le paiement séparément depuis la fiche
   * de l'inscription.
   */
  async create(dto: CreateOnboardingDto, agentId: string) {
    let etudiant;

    if (dto.etudiantId) {
      etudiant = await this.studentsService.findOne(dto.etudiantId);
    } else {
      if (!dto.nom || !dto.prenom || !dto.sexe || !dto.dateNaissance) {
        throw new BadRequestException(
          "Nom, prénom, sexe et date de naissance sont requis pour créer un nouvel universitaire.",
        );
      }
      etudiant = await this.studentsService.create({
        nom: dto.nom,
        prenom: dto.prenom,
        sexe: dto.sexe,
        type: dto.type,
        dateNaissance: dto.dateNaissance,
        lieuNaissance: dto.lieuNaissance,
        telephone: dto.telephone,
        email: dto.email,
        adresse: dto.adresse,
      });
    }

    if (!etudiant) throw new NotFoundException('Universitaire introuvable');

    const inscription = await this.enrollmentsService.create(
      {
        etudiantId: etudiant.id,
        filiereId: dto.filiereId,
        anneeUniversitaireId: dto.anneeUniversitaireId,
      },
      agentId,
    );

    let paiement = null;
    if (dto.paiementInitial) {
      paiement = await this.paymentsService.create(
        {
          inscriptionId: inscription.id,
          montant: dto.paiementInitial.montant,
          motif: dto.paiementInitial.motif,
          modePaiement: dto.paiementInitial.modePaiement,
        },
        agentId,
      );
    }

    return { etudiant, inscription, paiement };
  }
}
