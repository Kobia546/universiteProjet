import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { usePagination } from '../../../shared/hooks/usePagination';
import { messageErreur } from '../../../shared/lib/erreurs';
import { fetchNiveaux, fetchAnneesUniversitaires } from '../../programs/programsApi';
import {
  fetchReglesPaiement,
  createReglePaiement,
  updateReglePaiement,
  deleteReglePaiement,
  type TypeEtudiant,
} from '../api/paymentRulesApi';
import { formatMontant } from '../../../shared/lib/format';

export function ReglesTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [niveauId, setNiveauId] = useState('');
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [type, setType] = useState<TypeEtudiant | ''>('');
  const [montantTotal, setMontantTotal] = useState('');
  const [pourcentageInscription, setPourcentageInscription] = useState('60');
  const [nombreEcheances, setNombreEcheances] = useState('3');
  const queryClient = useQueryClient();

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const anneeActive = annees?.find((a) => a.active) ?? annees?.[0];

  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: regles, isLoading } = useQuery({
    queryKey: ['regles-paiement', anneeActive?.id],
    queryFn: () => fetchReglesPaiement(anneeActive?.id),
    enabled: !!anneeActive,
  });

  function reinitialiserFormulaire() {
    setEditingId(null);
    setNiveauId('');
    setType('');
    setMontantTotal('');
    setPourcentageInscription('60');
    setNombreEcheances('3');
  }

  function commencerEdition(regle: NonNullable<typeof regles>[number]) {
    setEditingId(regle.id);
    setNiveauId(regle.niveauId ?? '');
    setType(regle.type ?? '');
    setMontantTotal(String(regle.montantTotal));
    setPourcentageInscription(String(regle.pourcentageInscription));
    setNombreEcheances(String(regle.nombreEcheances));
  }

  const creerMutation = useMutation({
    mutationFn: createReglePaiement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
      reinitialiserFormulaire();
    },
  });

  const modifierMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateReglePaiement>[1]) =>
      updateReglePaiement(editingId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
      reinitialiserFormulaire();
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: deleteReglePaiement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
      setASupprimer(null);
    },
  });

  const page = usePagination(regles ?? [], anneeActive?.id);

  const enEdition = !!editingId;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {enEdition ? 'Modifier la règle de paiement' : 'Nouvelle règle de paiement'}
          </h2>
          {enEdition && (
            <button onClick={reinitialiserFormulaire} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Les frais dépendent du niveau et du type d'étudiant (pas de la filière). Laissez niveau
          et/ou type vides pour une règle plus générale ; la règle la plus spécifique (niveau +
          type) prime automatiquement.
          {anneeActive && ` S'applique à l'année ${anneeActive.libelle}.`}
          {enEdition && (
            <span className="ml-1 font-medium text-amber-600">
              Modifier cette règle ne change pas rétroactivement les inscriptions déjà créées.
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Niveau (optionnel)</label>
            <select
              value={niveauId}
              onChange={(e) => setNiveauId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Tous les niveaux</option>
              {niveaux?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Type (optionnel)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeEtudiant | '')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Étudiants et travailleurs</option>
              <option value="ETUDIANT">Étudiant uniquement</option>
              <option value="TRAVAILLEUR">Travailleur uniquement</option>
            </select>
          </div>
          <Input
            label="Montant total"
            type="number"
            min="0"
            value={montantTotal}
            onChange={(e) => setMontantTotal(e.target.value)}
          />
          <Input
            label="% à l'inscription"
            type="number"
            min="0"
            max="100"
            value={pourcentageInscription}
            onChange={(e) => setPourcentageInscription(e.target.value)}
          />
          <Input
            label="Nombre d'échéances (dont inscription)"
            type="number"
            min="1"
            value={nombreEcheances}
            onChange={(e) => setNombreEcheances(e.target.value)}
          />
        </div>
        {(creerMutation.isError || modifierMutation.isError) && (
          <p className="mt-3 text-sm text-red-600">
            {messageErreur(creerMutation.error ?? modifierMutation.error)}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-3">
          {enEdition ? (
            <Button
              disabled={!montantTotal}
              isLoading={modifierMutation.isPending}
              onClick={() =>
                modifierMutation.mutate({
                  niveauId: niveauId || undefined,
                  type: type || undefined,
                  montantTotal: Number(montantTotal),
                  pourcentageInscription: Number(pourcentageInscription),
                  nombreEcheances: Number(nombreEcheances),
                })
              }
            >
              Enregistrer les modifications
            </Button>
          ) : (
            <Button
              disabled={!montantTotal || !anneeActive}
              isLoading={creerMutation.isPending}
              onClick={() =>
                anneeActive &&
                creerMutation.mutate({
                  niveauId: niveauId || undefined,
                  type: type || undefined,
                  anneeUniversitaireId: anneeActive.id,
                  montantTotal: Number(montantTotal),
                  pourcentageInscription: Number(pourcentageInscription),
                  nombreEcheances: Number(nombreEcheances),
                })
              }
            >
              <Plus className="h-4 w-4" />
              Créer la règle
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !regles || regles.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune règle configurée pour cette année.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Niveau</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Montant total</th>
                <th className="px-5 py-3 text-right">% inscription</th>
                <th className="px-5 py-3 text-right">Échéances</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {page.pageItems.map((regle) => (
                <tr key={regle.id} className={editingId === regle.id ? 'bg-brand-50/50' : ''}>
                  <td className="px-5 py-3">{regle.niveau?.libelle ?? 'Tous'}</td>
                  <td className="px-5 py-3">
                    {regle.type === 'ETUDIANT'
                      ? 'Étudiant'
                      : regle.type === 'TRAVAILLEUR'
                        ? 'Travailleur'
                        : 'Tous'}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatMontant(regle.montantTotal)}
                  </td>
                  <td className="px-5 py-3 text-right">{regle.pourcentageInscription}%</td>
                  <td className="px-5 py-3 text-right">{regle.nombreEcheances}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => commencerEdition(regle)}
                        className="text-xs text-brand-700 underline"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setASupprimer(regle.id)}
                        className="text-xs text-red-600 underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        <div className="px-5 pb-4">
          <Pagination p={page} />
        </div>
      </Card>

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer cette règle ?"
        message="Les inscriptions déjà créées ne sont pas modifiées."
        isLoading={supprimerMutation.isPending}
        error={supprimerMutation.isError ? messageErreur(supprimerMutation.error) : null}
        onConfirm={() => aSupprimer && supprimerMutation.mutate(aSupprimer)}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}

