import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Input } from '../../shared/components/ui/Input';
import { fetchInscriptions } from '../enrollments/api/enrollmentsApi';
import { fetchFilieres, fetchAnneesUniversitaires } from '../programs/programsApi';
import { fetchEp703, fetchEp704 } from '../accounting/api/accountingApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

type Onglet = 'universitaires' | 'recettes' | 'depenses';

export function ConsultationsPage() {
  const [onglet, setOnglet] = useState<Onglet>('universitaires');

  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Rechercher des universitaires, recettes ou dépenses sur une période donnée"
      />

      <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'universitaires', label: 'Universitaires' },
            { key: 'recettes', label: 'Recettes' },
            { key: 'depenses', label: 'Dépenses' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOnglet(tab.key)}
            className={`rounded-md whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
              onglet === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {onglet === 'universitaires' && <UniversitairesTab />}
      {onglet === 'recettes' && <RecettesTab />}
      {onglet === 'depenses' && <DepensesTab />}
    </div>
  );
}

function UniversitairesTab() {
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const [filiereId, setFiliereId] = useState('');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });

  const { data: inscriptions, isLoading } = useQuery({
    queryKey: ['consultation-inscriptions', anneeUniversitaireId, filiereId],
    queryFn: () =>
      fetchInscriptions({
        anneeUniversitaireId: anneeUniversitaireId || undefined,
        filiereId: filiereId || undefined,
      }),
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Année universitaire</label>
            <select
              value={anneeUniversitaireId}
              onChange={(e) => setAnneeUniversitaireId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les années</option>
              {annees?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle} {a.active ? '(active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Filière</label>
            <select
              value={filiereId}
              onChange={(e) => setFiliereId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les filières</option>
              {filieres?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !inscriptions || inscriptions.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun résultat pour cette sélection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">N° inscription</th>
                  <th className="px-5 py-3">Universitaire</th>
                  <th className="px-5 py-3">Filière</th>
                  <th className="px-5 py-3">Année</th>
                  <th className="px-5 py-3 text-right">Montant dû</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inscriptions.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {i.numeroInscription}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {i.etudiant.prenom} {i.etudiant.nom}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{i.filiere.libelle}</td>
                    <td className="px-5 py-3 text-slate-500">{i.anneeUniversitaire.libelle}</td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatMontant(i.montantTotalDu)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={i.statut === 'ANNULEE' ? 'danger' : 'info'}>{i.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function RecettesTab() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: recettes, isLoading } = useQuery({
    queryKey: ['consultation-recettes', dateDebut, dateFin],
    queryFn: () => fetchEp703({ dateDebut: dateDebut || undefined, dateFin: dateFin || undefined }),
  });

  const total = recettes?.filter((r) => r.statut === 'VALIDE').reduce((s, r) => s + Number(r.montant), 0) ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Du" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          <Input label="Au" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">{recettes?.length ?? 0} écriture(s)</p>
          <p className="text-sm font-semibold text-brand-700">Total : {formatMontant(total)}</p>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !recettes || recettes.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune recette pour cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Bordereau</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recettes.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.numeroBordereau}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-slate-900">{r.libelle}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMontant(r.montant)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={r.statut === 'VALIDE' ? 'success' : 'default'}>{r.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function DepensesTab() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: depenses, isLoading } = useQuery({
    queryKey: ['consultation-depenses', dateDebut, dateFin],
    queryFn: () => fetchEp704({ dateDebut: dateDebut || undefined, dateFin: dateFin || undefined }),
  });

  const total = depenses?.filter((d) => d.statut === 'VALIDE').reduce((s, d) => s + Number(d.montant), 0) ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Du" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          <Input label="Au" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">{depenses?.length ?? 0} écriture(s)</p>
          <p className="text-sm font-semibold text-red-700">Total : {formatMontant(total)}</p>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !depenses || depenses.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune dépense pour cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">N° chèque</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Libellé</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depenses.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{d.numeroCheque}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(d.date)}</td>
                    <td className="px-5 py-3 text-slate-900">{d.libelle}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMontant(d.montant)}</td>
                    <td className="px-5 py-3">
                      <Badge variant={d.statut === 'VALIDE' ? 'success' : 'default'}>{d.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
