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
import { useAuthStore } from '../../auth/authStore';
import { fetchProfils } from '../../users/api/profilsApi';
import {
  fetchUsers,
  createUser,
  updateUser,
  setUserActif,
  deleteUser,
  type AppUser,
} from '../../users/api/usersApi';

export function UtilisateursTab() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [profilId, setProfilId] = useState('');
  const [aSupprimer, setASupprimer] = useState<AppUser | null>(null);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const { data: utilisateurs, isLoading } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const { data: profils } = useQuery({ queryKey: ['profils'], queryFn: fetchProfils });

  const page = usePagination(utilisateurs ?? []);

  function reinitialiserFormulaire() {
    setNom('');
    setPrenom('');
    setEmail('');
    setMotDePasse('');
    setProfilId('');
  }

  const creerMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reinitialiserFormulaire();
    },
  });

  const changerProfilMutation = useMutation({
    mutationFn: (input: { id: string; profilId: string }) =>
      updateUser(input.id, { profilId: input.profilId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const activerMutation = useMutation({
    mutationFn: (input: { id: string; actif: boolean }) => setUserActif(input.id, input.actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const supprimerMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setASupprimer(null);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
          Nouvel utilisateur
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Le profil choisi détermine ce que cet utilisateur pourra voir dans l'application.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Profil</label>
            <select
              value={profilId}
              onChange={(e) => setProfilId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Sélectionner un profil...</option>
              {profils?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
        {creerMutation.isError && (
          <p className="mt-3 text-sm text-red-600">
            {messageErreur(creerMutation.error)}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!nom || !prenom || !email || motDePasse.length < 8 || !profilId}
            isLoading={creerMutation.isPending}
            onClick={() => creerMutation.mutate({ nom, prenom, email, motDePasse, profilId })}
          >
            <Plus className="h-4 w-4" />
            Créer l'utilisateur
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Profil</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {page.pageItems.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {u.prenom} {u.nom}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={u.profil.id}
                        onChange={(e) =>
                          changerProfilMutation.mutate({ id: u.id, profilId: e.target.value })
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {profils?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nom}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      {u.actif ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="default">Inactif</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        disabled={u.id === currentUserId}
                        onClick={() => activerMutation.mutate({ id: u.id, actif: !u.actif })}
                        className="text-xs text-brand-700 underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        disabled={u.id === currentUserId}
                        onClick={() => setASupprimer(u)}
                        className="ml-3 text-xs text-red-600 underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                      >
                        Supprimer
                      </button>
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
        titre="Supprimer ce compte ?"
        message={
          <>
            Le compte de {aSupprimer?.prenom} {aSupprimer?.nom} sera supprimé. Si ce compte a déjà une
            activité enregistrée, la suppression est refusée : désactivez-le à la place.
          </>
        }
        isLoading={supprimerMutation.isPending}
        error={supprimerMutation.isError ? messageErreur(supprimerMutation.error) : null}
        onConfirm={() => aSupprimer && supprimerMutation.mutate(aSupprimer.id)}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
