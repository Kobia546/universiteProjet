import { Injectable } from '@nestjs/common';
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
   * Crée l'étudiant, son inscription, et (si fourni) son premier paiement,
   * en une seule opération côté interface — pour éviter à l'agent de
   * naviguer entre trois écrans séparés à chaque nouvelle inscription.
   *
   * NB : ce n'est pas une transaction SQL unique (chaque étape utilise son
   * propre service métier avec sa propre logique). Si le paiement échoue
   * après la création de l'étudiant et de l'inscription, ces deux-là
   * restent enregistrés — l'agent peut alors enregistrer le paiement
   * séparément depuis la fiche de l'inscription. C'est un compromis
   * raisonnable vu la complexité de chaque étape (génération de reçu,
   * écriture comptable, échéancier...).
   */
  async create(dto: CreateOnboardingDto, agentId: string) {
    const etudiant = await this.studentsService.create({
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
