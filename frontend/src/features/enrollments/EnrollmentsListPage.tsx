import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { fetchInscriptions } from './api/enrollmentsApi';
import { formatMontant } from '../../shared/lib/format';

const VARIANTE_STATUT: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  VALIDEE: 'success',
  ANNULEE: 'danger',
  EN_COURS: 'info',
  TRANSFEREE: 'default',
};

export function EnrollmentsListPage() {
  const navigate = useNavigate();

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['inscriptions'],
    queryFn: () => fetchInscriptions(),
  });

  return (
    <div>
      <PageHeader
        title="Inscriptions"
        description="Rattachement des étudiants à une filière, un niveau et une année"
        action={
          <Button onClick={() => navigate('/inscriptions/nouvelle')}>
            <Plus className="h-4 w-4" />
            Nouvelle inscription
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !inscriptions || inscriptions.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune inscription pour le moment.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">N° inscription</th>
                <th className="px-5 py-3">Étudiant</th>
                <th className="px-5 py-3">Filière</th>
                <th className="px-5 py-3">Niveau</th>
                <th className="px-5 py-3">Année</th>
                <th className="px-5 py-3 text-right">Montant dû</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inscriptions.map((inscription) => (
                <tr
                  key={inscription.id}
                  onClick={() => navigate(`/inscriptions/${inscription.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {inscription.numeroInscription}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {inscription.etudiant.prenom} {inscription.etudiant.nom}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{inscription.filiere.nom}</td>
                  <td className="px-5 py-3 text-slate-700">{inscription.niveau.code}</td>
                  <td className="px-5 py-3 text-slate-500">{inscription.anneeUniversitaire.libelle}</td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatMontant(inscription.montantTotalDu)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={VARIANTE_STATUT[inscription.statut] || 'default'}>
                      {inscription.statut}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
