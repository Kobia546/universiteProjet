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
  fetchAnneesUniversitaires,
  createAnneeUniversitaire,
  updateAnneeUniversitaire,
  deleteAnneeUniversitaire,
  activerAnneeUniversitaire,
  type AnneeUniversitaire,
} from '../../programs/programsApi';
import { formatDate } from '../../../shared/lib/format';

export function AnneesTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [libelle, setLibelle] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [aSupprimer, setASupprimer] = useState<AnneeUniversitaire | null>(null);
  const queryClient = useQueryClient();

  const { data: annees, isLoading } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const page = usePagination(annees ?? []);

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['annees-universitaires'] });
    queryClient.invalidateQueries({ queryKey: ['niveaux'] });
    queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
  }
  function reinitialiser() {
    setEditingId(null);
    setLibelle('');
    setDateDebut('');
    setDateFin('');
  }

  const creerMutation = useMutation({
    mutationFn: createAnneeUniversitaire,
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const modifierMutation = useMutation({
    mutationFn: (input: { libelle: string; dateDebut: string; dateFin: string }) =>
      updateAnneeUniversitaire(editingId!, input),
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const activerMutation = useMutation({ mutationFn: activerAnneeUniversitaire, onSuccess: invalider });
  const supprimerMutation = useMutation({
    mutationFn: deleteAnneeUniversitaire,
    onSuccess: () => {
      invalider();
      setASupprimer(null);
    },
  });

  const erreurForm = creerMutation.error ?? modifierMutation.error ?? activerMutation.error;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {editingId ? "Modifier l'année universitaire" : 'Nouvelle année universitaire'}
          </h2>
          {editingId && (
            <button onClick={reinitialiser} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Input
              label="Libellé"
              placeholder="2026-2027"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <Input label="Début" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          <Input label="Fin" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
          <Button
            disabled={!libelle || !dateDebut || !dateFin}
            isLoading={creerMutation.isPending || modifierMutation.isPending}
            onClick={() =>
              editingId
                ? modifierMutation.mutate({ libelle, dateDebut, dateFin })
                : creerMutation.mutate({ libelle, dateDebut, dateFin })
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3">Début</th>
                  <th className="px-5 py-3">Fin</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.pageItems.map((annee) => (
                  <tr key={annee.id} className={editingId === annee.id ? 'bg-brand-50/50' : ''}>
                    <td className="px-5 py-3 font-medium text-slate-900">{annee.libelle}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(annee.dateDebut)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(annee.dateFin)}</td>
                    <td className="px-5 py-3">
                      {annee.active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        {!annee.active && (
                          <button
                            onClick={() => activerMutation.mutate(annee.id)}
                            className="text-xs text-brand-700 underline"
                          >
                            Activer
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(annee.id);
                            setLibelle(annee.libelle);
                            setDateDebut(annee.dateDebut.slice(0, 10));
                            setDateFin(annee.dateFin.slice(0, 10));
                          }}
                          className="text-xs text-brand-700 underline"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setASupprimer(annee)}
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
        titre="Supprimer cette année ?"
        message={
          <>
            L'année « {aSupprimer?.libelle} » sera supprimée avec ses règles de paiement et ses
            ouvertures de niveaux. Impossible si des inscriptions y sont rattachées.
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
