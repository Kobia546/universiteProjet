import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { KpiCard } from './components/KpiCard';
import { fetchDashboardStats } from './api/dashboardApi';
import { fetchAnneesUniversitaires } from '../programs/programsApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

const COULEURS = ['#2b6249', '#4472c4', '#8cbfa7', '#7f9fd6', '#1a3d2e', '#a8c8b8'];

export function DashboardPage() {
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>('');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', anneeSelectionnee],
    queryFn: () => fetchDashboardStats(anneeSelectionnee || undefined),
  });

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={
          stats?.anneeUniversitaire
            ? `Vue d'ensemble — année ${stats.anneeUniversitaire.libelle}`
            : "Vue d'ensemble de l'activité de l'université"
        }
        action={
          <select
            value={anneeSelectionnee}
            onChange={(e) => setAnneeSelectionnee(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Année active</option>
            {annees?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle} {a.active ? '(active)' : ''}
              </option>
            ))}
          </select>
        }
      />

      {isLoading || !stats ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Étudiants (année sélectionnée)" value={String(stats.totalEtudiants)} icon={Users} />
            <KpiCard
              label="Inscriptions (année sélectionnée)"
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

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-3 border-red-100 bg-red-50/50">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                  Total impayé (toutes inscriptions)
                </p>
                <p className="tabular-nums font-serif text-xl font-semibold text-red-700">
                  {formatMontant(stats.totalImpaye)}
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 border-amber-100 bg-amber-50/50">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                  Échéances en attente ou en retard
                </p>
                <p className="tabular-nums font-serif text-xl font-semibold text-amber-800">
                  {stats.paiementsEnAttente.nombre} — {formatMontant(stats.paiementsEnAttente.montant)}
                </p>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <Card className="col-span-1 lg:col-span-2">
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Recettes et dépenses — 6 derniers mois
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.evolution6Mois}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => formatMontant(v)} />
                    <RechartsTooltip formatter={(v: any) => formatMontant(Number(v))} />
                    <Bar dataKey="recettes" name="Recettes" fill="#2b6249" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depenses" name="Dépenses" fill="#c4746a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Répartition par type
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              {stats.repartitionParType.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun étudiant pour le moment.</p>
              ) : (
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.repartitionParType}
                        dataKey="total"
                        nameKey="type"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
                      >
                        {stats.repartitionParType.map((_, index) => (
                          <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ul className="mt-2 space-y-1.5">
                {stats.repartitionParType.map((r, index) => (
                  <li key={r.type} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                    />
                    {r.type === 'TRAVAILLEUR' ? 'Travailleurs' : 'Étudiants'}
                    <span className="tabular-nums ml-auto font-medium text-slate-900">
                      {r.total}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
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
              <ul className="mt-2 space-y-1">
                {stats.repartitionParFiliere.map((r, index) => (
                  <li key={r.filiere} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                    />
                    {r.filiere} ({r.total})
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
