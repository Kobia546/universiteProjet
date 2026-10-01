import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { messageErreur } from '../../../shared/lib/erreurs';
import {
  fetchNiveaux,
  createNiveau,
  updateNiveau,
  deleteNiveau,
  ouvrirNiveau,
  fermerOuvertureNiveau,
  fetchAnneesUniversitaires,
  type Niveau,
} from '../../programs/programsApi';

export function NiveauxTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [aSupprimer, setASupprimer] = useState<Niveau | null>(null);

  const { data: niveaux, isLoading } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const anneeActive = annees?.find((a) => a.active) ?? annees?.[0];

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['niveaux'] });
  }
  function reinitialiser() {
    setEditingId(null);
    setCode('');
    setLibelle('');
  }

  const ouvrirMutation = useMutation({ mutationFn: ouvrirNiveau, onSuccess: invalider });
  const fermerMutation = useMutation({ mutationFn: fermerOuvertureNiveau, onSuccess: invalider });
  const creerMutation = useMutation({
    mutationFn: createNiveau,
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const modifierMutation = useMutation({
    mutationFn: (input: { code: string; libelle: string }) => updateNiveau(editingId!, input),
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const supprimerMutation = useMutation({
    mutationFn: deleteNiveau,
    onSuccess: () => {
      invalider();
      setASupprimer(null);
    },
  });

  const erreurForm = creerMutation.error ?? modifierMutation.error;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {editingId ? 'Modifier le niveau' : 'Nouveau niveau'}
          </h2>
          {editingId && (
            <button onClick={reinitialiser} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Les niveaux (Licence 1/2/3, Master 1/2) sont choisis en premier à l'inscription ; la
          filière est choisie ensuite. Ouvrez les niveaux qui accueillent des inscriptions pour
          l'année en cours{anneeActive ? ` (${anneeActive.libelle})` : ''}.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <Input
              label="Code"
              placeholder="L1"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <Input
              label="Libellé"
              placeholder="Licence 1"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <Button
            disabled={!code || !libelle}
            isLoading={creerMutation.isPending || modifierMutation.isPending}
            onClick={() =>
              editingId
                ? modifierMutation.mutate({ code, libelle })
                : creerMutation.mutate({ code, libelle })
            }
          >
            {editingId ? 'Enregistrer' : (<><Plus className="h-4 w-4" />Créer</>)}
          </Button>
        </div>
        {erreurForm && <p className="mt-3 text-sm text-red-600">{messageErreur(erreurForm)}</p>}
      </Card>

      {!anneeActive && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Aucune année universitaire active — activez-en une dans l'onglet "Années universitaires".
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {niveaux?.map((niveau) => {
            const ouverture = niveau.anneesOuvertes?.find(
              (a) => a.anneeUniversitaireId === anneeActive?.id,
            );
            const estOuvert = ouverture?.actif ?? false;
            return (
              <Card key={niveau.id} className={editingId === niveau.id ? 'bg-brand-50/50' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif text-lg font-semibold text-slate-900">{niveau.code}</p>
                    <p className="text-xs text-slate-500">{niveau.libelle}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {niveau._count?.inscriptions ?? 0} inscription(s)
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingId(niveau.id);
                        setCode(niveau.code);
                        setLibelle(niveau.libelle);
                      }}
                      className="text-xs text-brand-700 underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setASupprimer(niveau)}
                      className="text-xs text-red-600 underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  {estOuvert ? (
                    <button
                      onClick={() => ouverture && fermerMutation.mutate(ouverture.id)}
                      className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                    >
                      <Check className="h-3 w-3" />
                      Ouvert — cliquer pour fermer
                    </button>
                  ) : (
                    <button
                      disabled={!anneeActive}
                      onClick={() =>
                        anneeActive &&
                        ouvrirMutation.mutate({
                          niveauId: niveau.id,
                          anneeUniversitaireId: anneeActive.id,
                        })
                      }
                      className="w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                    >
                      Fermé — ouvrir
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer ce niveau ?"
        message={
          <>
            Le niveau « {aSupprimer?.libelle} » sera supprimé avec ses ouvertures, ses règles de
            paiement et ses rattachements de matières. Impossible s'il compte des inscriptions.
          </>
        }
        isLoading={supprimerMutation.isPending}
        error={supprimerMutation.isError ? messageErreur(supprimerMutation.error) : null}
        onConfirm={() => aSupprimer && supprimerMutation.mutate(aSupprimer.id)}
        onCancel={() => {
          setASupprimer(null);
          supprimerMutation.reset();
        }}
      />
    </div>
  );
}
