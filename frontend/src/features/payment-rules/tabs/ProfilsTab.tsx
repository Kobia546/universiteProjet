import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { messageErreur } from '../../../shared/lib/erreurs';
import { moduleLabels, type ModuleCode } from '../../../shared/components/layout/navItems';
import {
  fetchProfils,
  createProfil,
  updateProfil,
  deleteProfil,
  type Profil,
} from '../../users/api/profilsApi';

export function ProfilsTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<ModuleCode[]>([]);
  const [aSupprimer, setASupprimer] = useState<Profil | null>(null);
  const queryClient = useQueryClient();

  const { data: profils, isLoading } = useQuery({ queryKey: ['profils'], queryFn: fetchProfils });

  function reinitialiserFormulaire() {
    setEditingId(null);
    setNom('');
    setDescription('');
    setModules([]);
  }

  function commencerEdition(profil: Profil) {
    setEditingId(profil.id);
    setNom(profil.nom);
    setDescription(profil.description ?? '');
    setModules(profil.modules);
  }

  function toggleModule(code: ModuleCode) {
    setModules((m) => (m.includes(code) ? m.filter((x) => x !== code) : [...m, code]));
  }

  const creerMutation = useMutation({
    mutationFn: createProfil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profils'] });
      reinitialiserFormulaire();
    },
  });

  const modifierMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateProfil>[1]) => updateProfil(editingId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profils'] });
      reinitialiserFormulaire();
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: deleteProfil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profils'] });
      setASupprimer(null);
    },
  });

  const enEdition = !!editingId;
  const erreur = creerMutation.error || modifierMutation.error;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {enEdition ? 'Modifier le profil' : 'Nouveau profil'}
          </h2>
          {enEdition && (
            <button onClick={reinitialiserFormulaire} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Un profil définit ce qu'un utilisateur peut voir dans l'application — cochez uniquement
          les rubriques auxquelles il doit avoir accès.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nom du profil" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Input
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Modules visibles</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {moduleLabels.map(({ code, label }) => (
              <label
                key={code}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={modules.includes(code)}
                  onChange={() => toggleModule(code)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {erreur && (
          <p className="mt-3 text-sm text-red-600">
            {messageErreur(erreur)}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-3">
          {enEdition ? (
            <Button
              disabled={!nom || modules.length === 0}
              isLoading={modifierMutation.isPending}
              onClick={() =>
                modifierMutation.mutate({ nom, description: description || undefined, modules })
              }
            >
              Enregistrer les modifications
            </Button>
          ) : (
            <Button
              disabled={!nom || modules.length === 0}
              isLoading={creerMutation.isPending}
              onClick={() =>
                creerMutation.mutate({ nom, description: description || undefined, modules })
              }
            >
              <Plus className="h-4 w-4" />
              Créer le profil
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {profils?.map((profil) => (
            <Card key={profil.id} className={editingId === profil.id ? 'bg-brand-50/50' : ''}>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{profil.nom}</p>
                    {profil.systeme && <Badge variant="default">Système</Badge>}
                  </div>
                  {profil.description && (
                    <p className="text-xs text-slate-500">{profil.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {profil._count?.users ?? 0} utilisateur(s)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => commencerEdition(profil)}
                    className="text-xs text-brand-700 underline"
                  >
                    Modifier
                  </button>
                  {!profil.systeme && (
                    <button
                      onClick={() => setASupprimer(profil)}
                      className="text-xs text-red-600 underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profil.modules.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {moduleLabels.find((m) => m.code === code)?.label ?? code}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!aSupprimer}
        titre="Supprimer ce profil ?"
        message={<>Le profil « {aSupprimer?.nom} » sera supprimé. Impossible s'il est encore assigné à des utilisateurs.</>}
        isLoading={supprimerMutation.isPending}
        error={supprimerMutation.isError ? messageErreur(supprimerMutation.error) : null}
        onConfirm={() => aSupprimer && supprimerMutation.mutate(aSupprimer.id)}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}

