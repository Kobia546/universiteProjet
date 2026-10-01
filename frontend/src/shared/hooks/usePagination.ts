import { useEffect, useMemo, useState } from 'react';

export const TAILLE_PAGE = 15;

/**
 * Pagination côté client : 15 éléments par page. Retourne à la page 1
 * quand `cle` change (nouveau filtre, nouvelle recherche...).
 */
export function usePagination<T>(items: T[], cle?: string) {
  const [page, setPage] = useState(1);
  const nbPages = Math.max(1, Math.ceil(items.length / TAILLE_PAGE));

  useEffect(() => {
    setPage(1);
  }, [cle]);

  // Si la liste rétrécit (suppression), on reste dans les bornes.
  const pageCourante = Math.min(page, nbPages);

  const pageItems = useMemo(
    () => items.slice((pageCourante - 1) * TAILLE_PAGE, pageCourante * TAILLE_PAGE),
    [items, pageCourante],
  );

  return {
    page: pageCourante,
    setPage,
    nbPages,
    total: items.length,
    pageItems,
    debut: items.length === 0 ? 0 : (pageCourante - 1) * TAILLE_PAGE + 1,
    fin: Math.min(pageCourante * TAILLE_PAGE, items.length),
  };
}

export type Pagination = ReturnType<typeof usePagination>;
