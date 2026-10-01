import { Prisma } from '@prisma/client';

/** Violation de contrainte d'unicité (P2002). */
export function estDoublon(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

/** Violation de clé étrangère : l'élément est encore référencé (P2003). */
export function estEncoreReference(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003';
}
