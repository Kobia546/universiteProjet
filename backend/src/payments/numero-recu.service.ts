import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NumeroRecuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Numéro de reçu basé sur le carnet configuré pour l'année en cours
   * (Paramètres → Carnets de reçu). Si aucun carnet n'a encore été
   * configuré pour cette année, un carnet par défaut est créé
   * automatiquement (préfixe "REC", démarre à 1).
   *
   * Le compteur est incrémenté de façon atomique pour éviter deux reçus
   * avec le même numéro en cas de paiements simultanés.
   */
  async genererNumero(): Promise<string> {
    const annee = new Date().getFullYear();

    const carnet = await this.prisma.carnetRecu.upsert({
      where: { annee },
      update: { prochainNumero: { increment: 1 } },
      create: { annee, prefixe: 'REC', prochainNumero: 2 },
    });

    // Si le carnet vient d'être créé, prochainNumero vaut 2 (car "create"
    // ne passe pas par l'incrément) — le numéro utilisé pour CE reçu est
    // donc prochainNumero - 1 dans tous les cas.
    const numeroUtilise = carnet.prochainNumero - 1;

    return `${carnet.prefixe}-${annee}-${String(numeroUtilise).padStart(6, '0')}`;
  }
}
