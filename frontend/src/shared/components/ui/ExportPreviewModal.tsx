import { X, FileDown } from 'lucide-react';
import { Button } from './Button';

export interface ExportPreviewData {
  titre: string;
  sousTitre?: string;
  colonnes: string[];
  lignes: (string | number)[][];
  pied?: string;
}

/**
 * Aperçu du contenu avant génération du PDF — permet de vérifier les
 * données (et la sélection de filtres) avant de télécharger le fichier,
 * plutôt que de découvrir un export incorrect une fois ouvert.
 */
export function ExportPreviewModal({
  data,
  onClose,
  onConfirm,
  isExporting,
}: {
  data: ExportPreviewData | null;
  onClose: () => void;
  onConfirm: () => void;
  isExporting?: boolean;
}) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
              Aperçu avant export
            </p>
            <h3 className="font-serif text-lg font-semibold text-slate-900">{data.titre}</h3>
            {data.sousTitre && <p className="mt-0.5 text-xs text-slate-500">{data.sousTitre}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {data.lignes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Aucune donnée à exporter pour cette sélection.
            </p>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  {data.colonnes.map((col) => (
                    <th key={col} className="px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.lignes.map((ligne, i) => (
                  <tr key={i}>
                    {ligne.map((cellule, j) => (
                      <td key={j} className="px-3 py-2 text-slate-700">
                        {cellule}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {data.pied && (
            <p className="mt-4 text-right text-sm font-semibold text-slate-900">{data.pied}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isExporting}
            disabled={data.lignes.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Confirmer l'export PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
