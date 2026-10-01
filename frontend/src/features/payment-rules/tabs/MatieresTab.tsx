import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Link2, X } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { usePagination } from '../../../shared/hooks/usePagination';
import { messageErreur } from '../../../shared/lib/erreurs';
import {
  fetchMatieres,
  createMatiere,
  updateMatiere,
  deleteMatiere,
  fetchNiveaux,
  rattacherMatiere,
  detacherMatiere,
  type Matiere,
} from '../../programs/programsApi';

export function MatieresTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [niveauSelectionne, setNiveauSelectionne] = useState<Record<string, string>>({});
  const [aSupprimer, setASupprimer] = useState<Matiere | null>(null);
  const queryClient = useQueryClient();

  const { data: matieres, isLoading } = useQuery({ queryKey: ['matieres'], queryFn: fetchMatieres });
  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const page = usePagination(matieres ?? []);

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['matieres'] });
    queryClient.invalidateQueries({ queryKey: ['niveaux'] });
  }
  function reinitialiser() {
    setEditingId(null);
    setNom('');
    setCode('');
  }

  const creerMutation = useMutation({
    mutationFn: createMatiere,
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const modifierMutation = useMutation({
    mutationFn: (input: { nom: string; code: string }) => updateMatiere(editingId!, input),
    onSuccess: () => {
      invalider();
      reinitialiser();
    },
  });
  const actifMutation = useMutation({
    mutationFn: (input: { id: string; actif: boolean }) =>
      updateMatiere(input.id, { actif: input.actif }),
    onSuccess: invalider,
  });
  const supprimerMutation = useMutation({
    mutationFn: deleteMatiere,
    onSuccess: () => {
      invalider();
      setASupprimer(null);
    },
  });
  const rattacherMutation = useMutation({ mutationFn: rattacherMatiere, onSuccess: invalider });
  const detacherMutation = useMutation({ mutationFn: detacherMatiere, onSuccess: invalider });

  const erreurForm = creerMutation.error ?? modifierMutation.error;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {editingId ? 'Modifier la matière' : 'Nouvelle matière'}
          </h2>
          {editingId && (
            <button onClick={reinitialiser} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Catalogue informatif des modules enseignés — une matière peut être rattachée à plusieurs
          niveaux. N'affecte pas les inscriptions ni les paiements.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="w-32">
            <Input label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <Button
            disabled={!nom || !code}
            isLoading={creerMutation.isPending || modifierMutation.isPending}
            onClick={() =>
              editingId
                ? modifierMutation.mutate({ nom, code })
                : creerMutation.mutate({ nom, code })
            }
          >
            {editingId ? 'Enregistrer' : (<><Plus className="h-4 w-4" />Créer</>)}
          </Button>
        </div>
        {erreurForm && <p className="mt-3 text-sm text-red-600">{messageErreur(erreurForm)}</p>}
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {page.pageItems.map((matiere) => {
            const rattaches = new Set(matiere.niveaux?.map((n) => n.niveauId));
            const aAjouter = niveauSelectionne[matiere.id] ?? '';
            return (
              <Card key={matiere.id} className={editingId === matiere.id ? 'bg-brand-50/50' : ''}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{matiere.nom}</p>
                      {!matiere.actif && <Badge variant="default">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">Code : {matiere.code}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingId(matiere.id);
                        setNom(matiere.nom);
                        setCode(matiere.code);
                      }}
                      className="text-xs text-brand-700 underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => actifMutation.mutate({ id: matiere.id, actif: !matiere.actif })}
                      className="text-xs text-slate-600 underline"
                    >
                      {matiere.actif ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => setASupprimer(matiere)}
                      className="text-xs text-red-600 underline"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {matiere.niveaux?.map((rattachement) => (
                    <span
                      key={rattachement.id}
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {rattachement.niveau.code}
                      <button
                        onClick={() => detacherMutation.mutate(rattachement.id)}
                        className="text-brand-400 hover:text-brand-700"
                        title="Détacher"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={aAjouter}
                    onChange={(e) =>
                      setNiveauSelectionne((s) => ({ ...s, [matiere.id]: e.target.value }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Rattacher à un niveau...</option>
                    {niveaux
                      ?.filter((n) => !rattaches.has(n.id))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.libelle}
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={!aAjouter}
                    onClick={() => {
                      rattacherMutation.mutate({ niveauId: aAjouter, matiereId: matiere.id });
                      setNiveauSelectionne((s) => ({ ...s, [matiere.id]: '' }));
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-brand-700 disabled:opacity-40"
                  >
                    <Link2 className="h-3 w-3" />
                    Rattacher
                  </button>
                </div>
              </Card>
            );
          })}
          <Pagination p={page} />
        </div>
      )}

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer cette matière ?"
        message={<>La matière « {aSupprimer?.nom} » et ses rattachements aux niveaux seront supprimés.</>}
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
