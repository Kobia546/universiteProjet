import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Wallet, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { fetchEtudiant, supprimerEtudiant } from './api/studentsApi';
import { ConfirmDialog } from '../../shared/components/ui/ConfirmDialog';
import { Pagination } from '../../shared/components/ui/Pagination';
import { usePagination } from '../../shared/hooks/usePagination';
import { useEstAdmin } from '../../shared/hooks/useEstAdmin';
import { messageErreur } from '../../shared/lib/erreurs';
import { libelleProgramme } from '../../shared/lib/programme';
import { formatDate, formatMontant } from '../../shared/lib/format';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const estAdmin = useEstAdmin();
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);

  const { data: etudiant, isLoading } = useQuery({
    queryKey: ['etudiant', id],
    queryFn: () => fetchEtudiant(id!),
    enabled: !!id,
  });

  const pagePaiements = usePagination(etudiant?.paiements ?? [], id);

  const suppression = useMutation({
    mutationFn: () => supprimerEtudiant(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      navigate('/etudiants');
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!etudiant) return <p className="text-sm text-slate-500">Étudiant introuvable.</p>;

  return (
    <div>
      <PageHeader
        title={`${etudiant.prenom} ${etudiant.nom}`}
        description={`Matricule : ${etudiant.matricule}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/etudiants/${etudiant.id}/modifier`)}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Button>
            {estAdmin && (
              <Button variant="danger" onClick={() => setConfirmerSuppression(true)}>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={confirmerSuppression}
        titre="Supprimer cet étudiant ?"
        message={
          <>
            La fiche de {etudiant.prenom} {etudiant.nom} ({etudiant.matricule}) sera supprimée
            définitivement avec toutes ses inscriptions, échéances, paiements et reçus. Cette action
            est irréversible.
          </>
        }
        isLoading={suppression.isPending}
        error={suppression.isError ? messageErreur(suppression.error) : null}
        onConfirm={() => suppression.mutate()}
        onCancel={() => setConfirmerSuppression(false)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="col-span-1">
          <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">Informations personnelles</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Sexe</dt>
              <dd className="text-slate-900">{etudiant.sexe === 'M' ? 'Masculin' : 'Féminin'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Type</dt>
              <dd className="text-slate-900">
                {etudiant.type === 'TRAVAILLEUR' ? 'Travailleur' : 'Étudiant'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Lieu de naissance</dt>
              <dd className="text-slate-900">{etudiant.lieuNaissance || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Téléphone</dt>
              <dd className="text-slate-900">{etudiant.telephone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900">{etudiant.email || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Adresse</dt>
              <dd className="text-right text-slate-900">{etudiant.adresse || '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="col-span-2">
          <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">Inscriptions</h2>
          {!etudiant.inscriptions || etudiant.inscriptions.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune inscription pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {etudiant.inscriptions.map((inscription) => (
                <div
                  key={inscription.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {libelleProgramme(inscription.niveau, inscription.filiere)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inscription.anneeUniversitaire?.libelle} · N° {inscription.numeroInscription}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {inscription.statut !== 'ANNULEE' && (
                      (inscription.resteAPayer ?? 0) <= 0 ? (
                        <Badge variant="success">Soldé</Badge>
                      ) : (
                        <>
                          <Badge variant="danger">
                            Doit {formatMontant(inscription.resteAPayer ?? 0)}
                          </Badge>
                          <button
                            onClick={() =>
                              navigate(`/paiements/nouveau?inscriptionId=${inscription.id}`)
                            }
                            className="flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                          >
                            <Wallet className="h-3 w-3" />
                            Payer
                          </button>
                        </>
                      )
                    )}
                    <Badge
                      variant={
                        inscription.statut === 'VALIDEE'
                          ? 'success'
                          : inscription.statut === 'ANNULEE'
                            ? 'danger'
                            : 'info'
                      }
                    >
                      {inscription.statut}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="col-span-3">
          <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">Historique des paiements</h2>
          {!etudiant.paiements || etudiant.paiements.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Année</th>
                  <th className="py-2">Niveau – Filière</th>
                  <th className="py-2">Motif</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagePaiements.pageItems.map((paiement) => (
                  <tr key={paiement.id}>
                    <td className="py-2">{formatDate(paiement.datePaiement)}</td>
                    <td className="py-2 text-slate-500">
                      {paiement.inscription?.anneeUniversitaire?.libelle ?? '—'}
                    </td>
                    <td className="py-2 text-slate-500">
                      {paiement.inscription
                        ? libelleProgramme(paiement.inscription.niveau, paiement.inscription.filiere)
                        : '—'}
                    </td>
                    <td className="py-2">{paiement.motif}</td>
                    <td className="py-2">
                      {paiement.modePaiement === 'CHEQUE' ? (
                        <div>
                          <span>Chèque</span>
                          {(paiement.numeroCheque || paiement.banque) && (
                            <p className="text-xs text-slate-400">
                              {paiement.numeroCheque && `N° ${paiement.numeroCheque}`}
                              {paiement.numeroCheque && paiement.banque && ' · '}
                              {paiement.banque}
                            </p>
                          )}
                        </div>
                      ) : (
                        'Espèces'
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">{formatMontant(paiement.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          <Pagination p={pagePaiements} />
        </Card>
      </div>
    </div>
  );
}
