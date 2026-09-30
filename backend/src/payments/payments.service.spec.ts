import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('does not create an automatic accounting receipt when a payment is registered', async () => {
    const prisma = {
      inscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'inscription-1',
          statut: 'VALIDE',
          etudiantId: 'etudiant-1',
          etudiant: {
            prenom: 'Alice',
            nom: 'Dupont',
            matricule: 'M-001',
          },
        }),
      },
      paiement: {
        create: jest.fn().mockResolvedValue({
          id: 'paiement-1',
          inscriptionId: 'inscription-1',
          etudiantId: 'etudiant-1',
          montant: 1500,
          motif: 'Frais d’inscription',
          modePaiement: 'ESPECES',
          statut: 'VALIDE',
          datePaiement: new Date(),
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'paiement-1',
          inscriptionId: 'inscription-1',
          etudiantId: 'etudiant-1',
          montant: 1500,
          motif: 'Frais d’inscription',
          modePaiement: 'ESPECES',
          statut: 'VALIDE',
          datePaiement: new Date(),
          etudiant: {
            prenom: 'Alice',
            nom: 'Dupont',
            matricule: 'M-001',
          },
          inscription: {
            filiere: null,
            anneeUniversitaire: null,
            echeances: [],
            montantTotalDu: 1500,
            paiements: [{ id: 'paiement-1', montant: 1500 }],
          },
          recu: [],
          recette: null,
          agent: null,
        }),
      },
      recu: {
        create: jest.fn().mockResolvedValue({ id: 'recu-1' }),
      },
    } as any;

    const accountingService = {
      creerRecetteDepuisPaiement: jest.fn(),
      contrePasserRecette: jest.fn(),
    } as any;

    const carnetRecuService = {
      validerNumero: jest.fn().mockResolvedValue({ id: 'carnet-1' }),
    } as any;

    const auditService = {
      enregistrer: jest.fn().mockResolvedValue(undefined),
    } as any;

    const echeancesService = {
      recalculer: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new PaymentsService(
      prisma,
      accountingService,
      carnetRecuService,
      auditService,
      echeancesService,
    );

    const result = await service.create(
      {
        inscriptionId: 'inscription-1',
        montant: 1500,
        motif: 'Frais d’inscription',
        modePaiement: 'ESPECES',
        numeroRecu: 101,
      },
      'agent-1',
    );

    expect(prisma.paiement.create).toHaveBeenCalledTimes(1);
    expect(prisma.recu.create).toHaveBeenCalledTimes(1);
    expect(accountingService.creerRecetteDepuisPaiement).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
