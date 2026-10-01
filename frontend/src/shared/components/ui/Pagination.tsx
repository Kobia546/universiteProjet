import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Pagination as PaginationState } from '../../hooks/usePagination';

/** Barre de pagination : « 1–15 sur 42 » + Précédent / Suivant. */
export function Pagination({ p }: { p: PaginationState }) {
  if (p.total === 0 || p.nbPages <= 1) {
    return p.total > 0 ? (
      <p className="px-1 pt-3 text-xs text-slate-500">
        {p.total} élément{p.total > 1 ? 's' : ''}
      </p>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
      <p className="text-xs text-slate-500">
        {p.debut}–{p.fin} sur {p.total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => p.setPage(p.page - 1)}
          disabled={p.page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </button>
        <span className="text-xs text-slate-500">
          Page {p.page} / {p.nbPages}
        </span>
        <button
          type="button"
          onClick={() => p.setPage(p.page + 1)}
          disabled={p.page >= p.nbPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
