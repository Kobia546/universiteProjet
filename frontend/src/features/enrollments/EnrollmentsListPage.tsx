import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { fetchInscriptions } from './api/enrollmentsApi';
import { fetchAnneesUniversitaires } from '../programs/programsApi';
import { formatMontant } from '../../shared/lib/format';

const VARIANTE_STATUT: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  VALIDEE: 'success',
  ANNULEE: 'danger',
  EN_COURS: 'info',
  TRANSFEREE: 'default',
};

export function EnrollmentsListPage() {
  const navigate = useNavigate();
  const [anneeFiltre, setAnneeFiltre] = useState<string>('');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  // Par défaut, on affiche l'année active — pas toutes les années mêlées.
  useEffect(() => {
    if (!anneeFiltre && annees?.length) {
      const active = annees.find((a) => a.active) ?? annees[0];
      setAnneeFiltre(active.id);
    }
  }, [annees, anneeFiltre]);

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['inscriptions', anneeFiltre],
    queryFn: () => fetchInscriptions(anneeFiltre ? { anneeUniversitaireId: anneeFiltre } : {}),
    enabled: !!anneeFiltre || annees?.length === 0,
  });

  return (
    <div>
      <PageHeader
        title="Inscriptions"
        description="Rattachement des étudiants à une filière et une année"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={anneeFiltre}
              onChange={(e) => setAnneeFiltre(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les années</option>
              {annees?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle} {a.active ? '(active)' : ''}
                </option>
              ))}
            </select>
            <Button onClick={() => navigate('/inscriptions/nouvelle')}>
              <Plus className="h-4 w-4" />
              Nouvelle inscription
            </Button>
          </div>
        }
      />

      <p className="mb-4 text-xs text-slate-500">
        À utiliser pour une personne déjà connue dans l'app (ex : réinscription l'année suivante).
        Pour une toute nouvelle personne, utilise plutôt "Nouvel étudiant/travailleur" depuis le
        menu Étudiants & Travailleurs.
      </p>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !inscriptions || inscriptions.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune inscription pour cette sélection.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">N° inscription</th>
                <th className="px-5 py-3">Étudiant</th>
                <th className="px-5 py-3">Filière</th>
                <th className="px-5 py-3">Année</th>
                <th className="px-5 py-3 text-right">Montant dû</th>
                <th className="px-5 py-3">Solde</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
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
                  <td className="px-5 py-3 text-slate-700">{inscription.filiere.libelle}</td>
                  <td className="px-5 py-3 text-slate-500">{inscription.anneeUniversitaire.libelle}</td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatMontant(inscription.montantTotalDu)}
                  </td>
                  <td className="px-5 py-3">
                    {(inscription.resteAPayer ?? 0) <= 0 ? (
                      <Badge variant="success">Soldé</Badge>
                    ) : (
                      <Badge variant="danger">Doit {formatMontant(inscription.resteAPayer ?? 0)}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={VARIANTE_STATUT[inscription.statut] || 'default'}>
                      {inscription.statut}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {(inscription.resteAPayer ?? 0) > 0 && inscription.statut !== 'ANNULEE' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/paiements/nouveau?inscriptionId=${inscription.id}`);
                        }}
                        className="flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        <Wallet className="h-3 w-3" />
                        Payer
                      </button>
                    )}
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
