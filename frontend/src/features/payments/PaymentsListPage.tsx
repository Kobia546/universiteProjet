import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { fetchPaiements } from './api/paymentsApi';
import { formatDateHeure, formatMontant } from '../../shared/lib/format';

export function PaymentsListPage() {
  const navigate = useNavigate();

  const { data: paiements, isLoading } = useQuery({
    queryKey: ['paiements'],
    queryFn: () => fetchPaiements(),
  });

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Historique de tous les paiements enregistrés"
        action={
          <Button onClick={() => navigate('/paiements/nouveau')}>
            <Plus className="h-4 w-4" />
            Nouveau paiement
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !paiements || paiements.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Reçu</th>
                <th className="px-5 py-3">Étudiant</th>
                <th className="px-5 py-3">Motif</th>
                <th className="px-5 py-3">Mode</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Montant</th>
                <th className="px-5 py-3 text-right">Reste à payer (inscription)</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paiements.map((paiement) => (
                <tr
                  key={paiement.id}
                  onClick={() => navigate(`/paiements/${paiement.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">
                    {paiement.recu?.numeroRecu ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {paiement.etudiant.prenom} {paiement.etudiant.nom}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{paiement.motif}</td>
                  <td className="px-5 py-3 text-slate-500">{paiement.modePaiement}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDateHeure(paiement.datePaiement)}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatMontant(paiement.montant)}</td>
                  <td className="px-5 py-3 text-right">
                    {(paiement.resteAPayerInscription ?? 0) <= 0 ? (
                      <Badge variant="success">Soldé</Badge>
                    ) : (
                      <Badge variant="danger">
                        {formatMontant(paiement.resteAPayerInscription ?? 0)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={paiement.statut === 'VALIDE' ? 'success' : 'danger'}>
                      {paiement.statut}
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
