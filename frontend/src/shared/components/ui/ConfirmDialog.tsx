import { Button } from './Button';

interface Props {
  open: boolean;
  titre: string;
  message: React.ReactNode;
  confirmLabel?: string;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Boîte de confirmation pour les actions destructrices. */
export function ConfirmDialog({
  open,
  titre,
  message,
  confirmLabel = 'Supprimer',
  isLoading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">{titre}</h3>
        <div className="mt-2 text-sm text-slate-600">{message}</div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
