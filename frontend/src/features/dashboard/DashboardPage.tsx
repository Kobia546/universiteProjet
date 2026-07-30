import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, TrendingUp, TrendingDown, Gauge, BadgePercent } from 'lucide-react';
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

  const libelleAnnee = stats?.anneeUniversitaire?.libelle ?? '';

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={
          stats?.anneeUniversitaire
            ? `Vue d'ensemble — année ${libelleAnnee}`
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
            <KpiCard
              label={`Universitaires ${libelleAnnee}`}
              value={String(stats.totalUniversitaires)}
              icon={Users}
            />
            <KpiCard
              label={`Inscriptions ${libelleAnnee}`}
              value={String(stats.nouveauxInscrits)}
              icon={GraduationCap}
            />
            <KpiCard
              label="Recettes du mois en cours"
              value={formatMontant(stats.revenusDuMois)}
              icon={TrendingUp}
            />
            <KpiCard
              label="Dépenses du mois en cours"
              value={formatMontant(stats.depensesDuMois)}
              icon={TrendingDown}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-3 border-brand-100 bg-brand-50/50">
              <BadgePercent className="h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  Taux de règlement des inscriptions {libelleAnnee}
                </p>
                <p className="tabular-nums font-serif text-xl font-semibold text-brand-800">
                  {stats.tauxReglementInscriptions.toFixed(0)} %
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 border-amber-100 bg-amber-50/50">
              <Gauge className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                  Taux de règlement de la scolarité {libelleAnnee}
                </p>
                <p className="tabular-nums font-serif text-xl font-semibold text-amber-800">
                  {stats.tauxReglementScolarite.toFixed(0)} %
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
                Répartition par type d'universitaire {libelleAnnee}
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              {stats.repartitionParType.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun universitaire pour le moment.</p>
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
                      ({r.total})
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <Card className="col-span-1 lg:col-span-2">
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Les 5 Dernières opérations
              </h2>
              <div className="rule-perforee mb-4 mt-2" />
              {stats.dernieresOperations.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune opération pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {stats.dernieresOperations.slice(0, 5).map((op) => (
                        <tr key={`${op.type}-${op.id}`}>
                          <td className="py-2.5 text-slate-700">{op.libelle}</td>
                          <td className="py-2.5 text-right text-xs text-slate-400">
                            {formatDate(op.date)}
                          </td>
                          <td
                            className={`tabular-nums py-2.5 text-right font-mono font-medium ${
                              op.type === 'depense' ? 'text-red-600' : 'text-brand-700'
                            }`}
                          >
                            {op.type === 'depense' ? '-' : '+'}
                            {formatMontant(op.montant)}
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
                Répartition par filière {libelleAnnee}
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
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COULEURS[index % COULEURS.length] }}
                    />
                    {r.filiere}
                    <span className="tabular-nums ml-auto font-medium text-slate-900">
                      ({r.total})
                    </span>
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
