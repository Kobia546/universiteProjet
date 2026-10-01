import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';
import { messageErreur } from '../../../shared/lib/erreurs';
import {
  fetchFilieres,
  createFiliere,
  updateFiliere,
  deleteFiliere,
  type Filiere,
} from '../../programs/programsApi';

export function FilieresTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [libelle, setLibelle] = useState('');
  const [aSupprimer, setASupprimer] = useState<Filiere | null>(null);

  const { data: filieres, isLoading } = useQuery({
    queryKey: ['filieres'],
    queryFn: () => fetchFilieres(),
  });
  const page = usePagination(filieres ?? []);

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['filieres'] });
  }
  function reinitialiser() {
    setEditingId(null);
    setCode('');
    setLibelle('');
  }

  const creerMutation = useMutation({
    mutationFn: createFiliere,
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const modifierMutation = useMutation({
    mutationFn: (input: { code?: string; libelle?: string; actif?: boolean }) =>
      updateFiliere(editingId!, input),
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const actifMutation = useMutation({
    mutationFn: (input: { id: string; actif: boolean }) =>
      updateFiliere(input.id, { actif: input.actif }),
    onSuccess: invalider,
  });
  const supprimerMutation = useMutation({
    mutationFn: deleteFiliere,
    onSuccess: () => {
      invalider();
      setASupprimer(null);
    },
  });

  const erreurForm = creerMutation.error ?? modifierMutation.error ?? actifMutation.error;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {editingId ? 'Modifier la filière' : 'Nouvelle filière'}
          </h2>
          {editingId && (
            <button onClick={reinitialiser} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Les filières (spécialités) sont proposées à l'inscription après le choix du niveau. Une
          filière désactivée n'est plus proposée mais reste visible sur les inscriptions existantes.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <Input
              label="Code"
              placeholder="DA"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <Input
              label="Libellé"
              placeholder="Droit des Affaires"
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

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !filieres || filieres.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune filière — créez-en une ci-dessus.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3 text-right">Inscriptions</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.pageItems.map((f) => (
                  <tr key={f.id} className={editingId === f.id ? 'bg-brand-50/50' : ''}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{f.code}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{f.libelle}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {f._count?.inscriptions ?? 0}
                    </td>
                    <td className="px-5 py-3">
                      {f.actif ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Désactivée</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingId(f.id);
                            setCode(f.code);
                            setLibelle(f.libelle);
                          }}
                          className="text-xs text-brand-700 underline"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => actifMutation.mutate({ id: f.id, actif: !f.actif })}
                          className="text-xs text-slate-600 underline"
                        >
                          {f.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => setASupprimer(f)}
                          className="text-xs text-red-600 underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 pb-4">
          <Pagination p={page} />
        </div>
      </Card>

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer cette filière ?"
        message={
          <>
            La filière « {aSupprimer?.libelle} » sera supprimée. Impossible si des inscriptions y
            sont rattachées — désactivez-la alors.
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
