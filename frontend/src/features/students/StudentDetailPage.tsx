import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { fetchEtudiant } from './api/studentsApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: etudiant, isLoading } = useQuery({
    queryKey: ['etudiant', id],
    queryFn: () => fetchEtudiant(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!etudiant) return <p className="text-sm text-slate-500">Étudiant introuvable.</p>;

  return (
    <div>
      <PageHeader
        title={`${etudiant.prenom} ${etudiant.nom}`}
        description={`Matricule : ${etudiant.matricule}`}
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
              <dt className="text-slate-500">Date de naissance</dt>
              <dd className="text-slate-900">{formatDate(etudiant.dateNaissance)}</dd>
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
                      {inscription.filiere?.nom} — {inscription.niveau?.code}
                    </p>
                    <p className="text-xs text-slate-500">
                      {inscription.anneeUniversitaire?.libelle} · N° {inscription.numeroInscription}
                    </p>
                  </div>
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
              ))}
            </div>
          )}
        </Card>

        <Card className="col-span-3">
          <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">Historique des paiements</h2>
          {!etudiant.paiements || etudiant.paiements.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Motif</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {etudiant.paiements.map((paiement) => (
                  <tr key={paiement.id}>
                    <td className="py-2">{formatDate(paiement.datePaiement)}</td>
                    <td className="py-2">{paiement.motif}</td>
                    <td className="py-2">{paiement.modePaiement}</td>
                    <td className="py-2 text-right font-medium">{formatMontant(paiement.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      </div>
    </div>
  );
}
