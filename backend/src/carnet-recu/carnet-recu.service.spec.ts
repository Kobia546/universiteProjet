import { BadRequestException } from '@nestjs/common';
import { CarnetRecuService } from './carnet-recu.service';

function creerService(options: {
  carnet?: any;
  exclu?: any;
  recu?: any;
  recus?: { numeroRecu: string }[];
  exclusions?: { numero: number }[];
}) {
  const carnetActif = options.carnet ?? { id: 'c1', numeroDebut: 90, numeroFin: 95, actif: true };
  const prisma: any = {
    carnetRecu: {
      findFirst: jest.fn().mockResolvedValue(options.carnet === null ? null : carnetActif),
      findUnique: jest.fn().mockResolvedValue({
        ...carnetActif,
        recus: options.recus ?? [],
        exclusions: options.exclusions ?? [],
      }),
    },
    numeroCarnetExclu: {
      findUnique: jest.fn().mockResolvedValue(options.exclu ?? null),
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    recu: { findUnique: jest.fn().mockResolvedValue(options.recu ?? null) },
  };
  const audit: any = { enregistrer: jest.fn() };
  return { service: new CarnetRecuService(prisma, audit), prisma };
}

describe('CarnetRecuService', () => {
  describe('validerNumero', () => {
    it('accepte un numéro libre du carnet', async () => {
      const { service } = creerService({});
      await expect(service.validerNumero(92)).resolves.toMatchObject({ id: 'c1' });
    });

    it('refuse un numéro déclaré supprimé/arraché', async () => {
      const { service } = creerService({ exclu: { id: 'x1', numero: 92 } });
      await expect(service.validerNumero(92)).rejects.toThrow(/supprimé/);
    });

    it('refuse un numéro hors de tout carnet actif', async () => {
      const { service } = creerService({ carnet: null });
      await expect(service.validerNumero(500)).rejects.toThrow(BadRequestException);
    });

    it('refuse un numéro déjà utilisé', async () => {
      const { service } = creerService({ recu: { id: 'r1' } });
      await expect(service.validerNumero(91)).rejects.toThrow(/déjà été utilisé/);
    });
  });

  describe('ajouterExclusions', () => {
    it('enregistre des numéros dans la plage, sans doublons', async () => {
      const { service, prisma } = creerService({});
      const res = await service.ajouterExclusions('c1', { numeros: [92, 92, 93], motif: 'déchirés' }, 'u1');
      expect(prisma.numeroCarnetExclu.createMany).toHaveBeenCalledWith({
        data: [
          { carnetRecuId: 'c1', numero: 92, motif: 'déchirés' },
          { carnetRecuId: 'c1', numero: 93, motif: 'déchirés' },
        ],
        skipDuplicates: true,
      });
      expect(res.ajoutes).toBe(2);
    });

    it('refuse (rien enregistré) si un numéro est hors du carnet', async () => {
      const { service, prisma } = creerService({});
      await expect(service.ajouterExclusions('c1', { numeros: [92, 120] }, 'u1')).rejects.toThrow(
        /hors du carnet/i,
      );
      expect(prisma.numeroCarnetExclu.createMany).not.toHaveBeenCalled();
    });

    it('refuse un numéro déjà utilisé par un reçu émis', async () => {
      const { service, prisma } = creerService({ recus: [{ numeroRecu: '93' }] });
      await expect(service.ajouterExclusions('c1', { numeros: [93] }, 'u1')).rejects.toThrow(
        /déjà utilisé/i,
      );
      expect(prisma.numeroCarnetExclu.createMany).not.toHaveBeenCalled();
    });
  });
});
