import axios from 'axios';

/** Extrait un message lisible d'une erreur d'API (NestJS) ou réseau. */
export function messageErreur(error: unknown, parDefaut = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
    if (!error.response) return 'Impossible de joindre le serveur.';
  }
  return parDefaut;
}
