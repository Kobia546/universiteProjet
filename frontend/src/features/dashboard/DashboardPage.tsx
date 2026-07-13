import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { KpiCard } from './components/KpiCard';
import { fetchDashboardStats } from './api/dashboardApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

// Palette dérivée du vert institutionnel + du bleu UFR SJAP (logos réels),
// plutôt que la gamme indigo par défaut.
const COULEURS = ['#2b6249', '#4472c4', '#8cbfa7', '#7f9fd6', '#1a3d2e', '#a8c8b8'];

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité de l'université"
      />

      {isLoading || !stats ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total étudiants" value={String(stats.totalEtudiants)} icon={Users} />
            <KpiCard
              label="Nouveaux inscrits (ce mois)"
              value={String(stats.nouveauxInscrits)}
              icon={UserPlus}
            />
            <KpiCard
              label="Revenus du mois"
              value={formatMontant(stats.revenusDuMois)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Dépenses du mois"
              value={formatMontant(stats.depensesDuMois)}
              icon={TrendingDown}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <Card className="col-span-1 lg:col-span-2">
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Dernières opérations
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              {stats.dernieresOperations.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune opération pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {stats.dernieresOperations.map((op) => (
                        <tr key={op.id}>
                          <td className="py-2.5 text-slate-700">{op.libelle}</td>
                          <td className="py-2.5 text-right text-xs text-slate-400">
                            {formatDate(op.date)}
                          </td>
                          <td className="tabular-nums py-2.5 text-right font-mono font-medium text-brand-700">
                            +{formatMontant(op.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Répartition par filière
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              {stats.repartitionParFiliere.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune inscription pour le moment.</p>
              ) : (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.repartitionParFiliere}
                        dataKey="total"
                        nameKey="filiere"
                        innerRadius={42}
                        outerRadius={70}
                        paddingAngle={2}
                      >
                        {stats.repartitionParFiliere.map((_, index) => (
                          <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="mt-2 space-y-1.5">
                {stats.repartitionParFiliere.map((r, index) => (
                  <li key={r.filiere} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                    />
                    <span className="truncate">{r.filiere}</span>
                    <span className="tabular-nums ml-auto font-medium text-slate-900">
                      {r.total}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              <span className="tabular-nums font-semibold">
                {stats.paiementsEnAttente.nombre}
              </span>{' '}
              échéance(s) en attente ou en retard, pour un total de{' '}
              <span className="tabular-nums font-semibold">
                {formatMontant(stats.paiementsEnAttente.montant)}
              </span>
              .
            </p>
          </div>
        </>
      )}
    </div>
  );
}
