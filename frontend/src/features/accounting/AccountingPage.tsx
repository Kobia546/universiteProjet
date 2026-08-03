import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FileDown } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import {
  fetchEp703,
  fetchEp704,
  fetchEp706,
  creerDepense,
  contrePasserRecette,
  contrePasserDepense,
  creerOperationCaisse,
  type TypeOperationCaisse,
  type TypePaiementOperation,
} from './api/accountingApi';
import { formatDate, formatMontant, formatMontantPdf } from '../../shared/lib/format';
import { montantEnLettres } from '../../shared/lib/montantEnLettres';
import { exporterPdf } from '../../shared/lib/exporterPdf';
import { BANQUES_COTE_DIVOIRE } from '../../shared/data/banques';

type Onglet = 'operation-caisse' | 'recettes' | 'depenses' | 'centralisateur';

export function AccountingPage() {
  const [onglet, setOnglet] = useState<Onglet>('centralisateur');

  return (
    <div>
      <PageHeader
        title="Comptabilité"
        description="EP703 (recettes) · EP704 (dépenses) · EP706 (centralisateur)"
        action={
          <Button onClick={() => setOnglet('operation-caisse')}>
            <Plus className="h-4 w-4" />
            Nouvelle opération de caisse
          </Button>
        }
      />

      <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'centralisateur', label: 'EP706 — Centralisateur' },
            { key: 'recettes', label: 'EP703 — Recettes' },
            { key: 'depenses', label: 'EP704 — Dépenses' },
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

      {onglet === 'operation-caisse' && <OperationCaisseTab />}
      {onglet === 'centralisateur' && <CentralisateurTab />}
      {onglet === 'recettes' && <RecettesTab />}
      {onglet === 'depenses' && <DepensesTab />}
    </div>
  );
}

function OperationCaisseTab() {
  const [type, setType] = useState<TypeOperationCaisse>('ENTREE');
  const [modePaiement, setModePaiement] = useState<TypePaiementOperation>('ESPECES');
  const [requerant, setRequerant] = useState('');
  const [objet, setObjet] = useState('');
  const [montant, setMontant] = useState('');
  const [banque, setBanque] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: creerOperationCaisse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ep703'] });
      queryClient.invalidateQueries({ queryKey: ['ep704'] });
      queryClient.invalidateQueries({ queryKey: ['ep706'] });
      setRequerant('');
      setObjet('');
      setMontant('');
      setBanque('');
      setNumeroCheque('');
      setModePaiement('ESPECES');
      setDate(new Date().toISOString().slice(0, 10));
    },
  });

  const peutValider =
    objet &&
    montant &&
    Number(montant) > 0 &&
    (modePaiement !== 'CHEQUE' || (banque.trim() && numeroCheque.trim()));

  return (
    <Card className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-center gap-2">
       
        <h2 className="text-center font-serif text-lg font-bold uppercase tracking-wide text-slate-900">
          Operation de Caisse
        </h2>
      </div>
      <p className="mb-5 text-center text-xs text-slate-500">
        Toute opération enregistrée ici crée automatiquement une écriture EP703 (Entrée) ou EP704
        (Sortie) — visible dans les onglets correspondants.
      </p>

      {/* Entrée / Sortie, façon cases à cocher du bon papier */}
      <div className="mb-5 flex justify-center gap-6">
        {(
          [
            { value: 'ENTREE' as const, label: 'Entrée de caisse' },
            { value: 'SORTIE' as const, label: 'Sortie de caisse' },
          ]
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setType(option.value)}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                type === option.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300'
              }`}
            >
              {type === option.value && '✓'}
            </span>
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Input
          label="Requérant"
          placeholder="Nom de la personne à l'origine de l'opération"
          value={requerant}
          onChange={(e) => setRequerant(e.target.value)}
        />
        <Input
          label="Objet"
          placeholder="Motif de l'opération"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Type de paiement</label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as TypePaiementOperation)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ESPECES">Espèces</option>
              <option value="CHEQUE">Chèque</option>
            </select>
          </div>
          <Input
            label="Montant (F CFA)"
            type="number"
            min="0"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
        </div>

        {modePaiement === 'CHEQUE' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Banque</label>
              <select
                value={banque}
                onChange={(e) => setBanque(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sélectionner une banque</option>
                {BANQUES_COTE_DIVOIRE.map((nomBanque) => (
                  <option key={nomBanque} value={nomBanque}>
                    {nomBanque}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Numéro de chèque"
              placeholder="Ex : 001254"
              value={numeroCheque}
              onChange={(e) => setNumeroCheque(e.target.value)}
            />
          </div>
        )}
        {montant && Number(montant) > 0 && (
          <p className="text-xs italic text-slate-500">
            {montantEnLettres(Number(montant))}
          </p>
        )}
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {mutation.isError && (
        <p className="mt-3 text-sm text-red-600">
          {(mutation.error as any)?.response?.data?.message ||
            "Une erreur est survenue lors de l'enregistrement."}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="mt-3 text-sm text-emerald-600">
          Opération enregistrée — écriture{' '}
          {type === 'ENTREE' ? 'EP703 (recette)' : 'EP704 (dépense)'} créée.
        </p>
      )}

      <div className="mt-5 flex justify-center">
        <Button
          disabled={!peutValider}
          isLoading={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              type,
              requerant: requerant || undefined,
              objet,
              montant: Number(montant),
              date,
              modePaiement,
              banque: modePaiement === 'CHEQUE' ? banque : undefined,
              numeroCheque: modePaiement === 'CHEQUE' ? numeroCheque : undefined,
            })
          }
        >
          Enregistrer l'opération
        </Button>
      </div>
    </Card>
  );
}

function CentralisateurTab() {
  const { data, isLoading } = useQuery({ queryKey: ['ep706'], queryFn: () => fetchEp706() });

  if (isLoading) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!data) return null;

  function exporter() {
    if (!data) return;
    exporterPdf({
      titre: 'EP706 — Centralisateur',
      sousTitre: `Export du ${formatDate(new Date().toISOString())}`,
      colonnes: ['Indicateur', 'Valeur'],
      lignes: [
        ['Total recettes (EP703)', formatMontantPdf(data.totalRecettes)],
        ['Total dépenses (EP704)', formatMontantPdf(data.totalDepenses)],
        ['Solde', formatMontantPdf(data.solde)],
        ["Nombre d'opérations", String(data.nombreOperations)],
      ],
      nomFichier: 'ep706-centralisateur',
    });
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={exporter}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-700 underline"
        >
          <FileDown className="h-3.5 w-3.5" />
          Exporter en PDF
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total recettes</p>
          <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-emerald-600">
            {formatMontant(data.totalRecettes)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total dépenses</p>
          <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-red-600">
            {formatMontant(data.totalDepenses)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Solde</p>
          <p className={`tabular-nums mt-1 font-serif text-xl font-semibold ${data.solde >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {formatMontant(data.solde)}
          </p>
        </Card>
        <Card className="col-span-3">
          <p className="text-sm text-slate-500">
            {data.nombreOperations} opération(s) comptabilisée(s) au total (toutes périodes).
          </p>
        </Card>
      </div>
    </div>
  );
}

function RecettesTab() {
  const { data: recettes, isLoading } = useQuery({
    queryKey: ['ep703'],
    queryFn: () => fetchEp703(),
  });
  const queryClient = useQueryClient();

  const contrePasserMutation = useMutation({
    mutationFn: contrePasserRecette,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ep703'] });
      queryClient.invalidateQueries({ queryKey: ['ep706'] });
    },
  });

  function exporter() {
    if (!recettes || recettes.length === 0) return;
    const total = recettes
      .filter((r) => r.statut === 'VALIDE')
      .reduce((s, r) => s + Number(r.montant), 0);
    exporterPdf({
      titre: 'EP703 — Registre des recettes',
      sousTitre: `${recettes.length} écriture(s) — export du ${formatDate(new Date().toISOString())}`,
      colonnes: ['Bordereau', 'Date', 'Libellé', 'Débit/Crédit', 'Montant', 'Statut'],
      lignes: recettes.map((r) => [
        r.numeroBordereau,
        formatDate(r.date),
        r.libelle,
        `${r.compteDebit} / ${r.compteCredit}`,
        formatMontantPdf(r.montant),
        r.statut,
      ]),
      pied: `Total recettes valides : ${formatMontantPdf(total)}`,
      nomFichier: 'ep703-recettes',
    });
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <p className="text-xs text-slate-500">
          {recettes?.length ?? 0} écriture(s) enregistrée(s)
        </p>
        <button
          onClick={exporter}
          disabled={!recettes || recettes.length === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-700 underline disabled:opacity-40"
        >
          <FileDown className="h-3.5 w-3.5" />
          Exporter en PDF
        </button>
      </div>
      {isLoading ? (
        <p className="p-6 text-sm text-slate-500">Chargement...</p>
      ) : !recettes || recettes.length === 0 ? (
        <p className="p-6 text-sm text-slate-500">Aucune recette enregistrée.</p>
      ) : (
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Bordereau</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Libellé</th>
              <th className="px-5 py-3">Débit / Crédit</th>
              <th className="px-5 py-3 text-right">Montant</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recettes.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.numeroBordereau}</td>
                <td className="px-5 py-3 text-slate-500">{formatDate(r.date)}</td>
                <td className="px-5 py-3 text-slate-900">{r.libelle}</td>
                <td className="px-5 py-3 text-xs text-slate-500">
                  {r.compteDebit} / {r.compteCredit}
                </td>
                <td className="px-5 py-3 text-right font-medium">{formatMontant(r.montant)}</td>
                <td className="px-5 py-3">
                  <Badge variant={r.statut === 'VALIDE' ? 'success' : 'default'}>{r.statut}</Badge>
                </td>
                <td className="px-5 py-3">
                  {r.statut === 'VALIDE' && (
                    <button
                      onClick={() => contrePasserMutation.mutate(r.id)}
                      className="text-xs text-red-600 underline"
                    >
                      Contre-passer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </Card>
  );
}

function DepensesTab() {
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const queryClient = useQueryClient();

  const { data: depenses, isLoading } = useQuery({
    queryKey: ['ep704'],
    queryFn: () => fetchEp704(),
  });

  const creerMutation = useMutation({
    mutationFn: creerDepense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ep704'] });
      queryClient.invalidateQueries({ queryKey: ['ep706'] });
      setLibelle('');
      setMontant('');
    },
  });

  const contrePasserMutation = useMutation({
    mutationFn: contrePasserDepense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ep704'] });
      queryClient.invalidateQueries({ queryKey: ['ep706'] });
    },
  });

  function exporter() {
    if (!depenses || depenses.length === 0) return;
    const total = depenses
      .filter((d) => d.statut === 'VALIDE')
      .reduce((s, d) => s + Number(d.montant), 0);
    exporterPdf({
      titre: 'EP704 — Registre des dépenses',
      sousTitre: `${depenses.length} écriture(s) — export du ${formatDate(new Date().toISOString())}`,
      colonnes: ['N° opération', 'Date', 'Libellé', 'Débit/Crédit', 'Montant', 'Statut'],
      lignes: depenses.map((d) => [
        d.numeroOperation,
        formatDate(d.date),
        d.libelle,
        `${d.compteDebit} / ${d.compteCredit}`,
        formatMontantPdf(d.montant),
        d.statut,
      ]),
      pied: `Total dépenses valides : ${formatMontantPdf(total)}`,
      nomFichier: 'ep704-depenses',
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-serif text-[15px] font-semibold text-slate-900">Nouvelle dépense</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Input
              label="Libellé"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex : Achat fournitures bureau"
            />
          </div>
          <div className="w-40">
            <Input
              label="Montant"
              type="number"
              min="0"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          </div>
          <Button
            disabled={!libelle || !montant}
            isLoading={creerMutation.isPending}
            onClick={() => creerMutation.mutate({ libelle, montant: Number(montant) })}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            {depenses?.length ?? 0} écriture(s) enregistrée(s)
          </p>
          <button
            onClick={exporter}
            disabled={!depenses || depenses.length === 0}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-700 underline disabled:opacity-40"
          >
            <FileDown className="h-3.5 w-3.5" />
            Exporter en PDF
          </button>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !depenses || depenses.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune dépense enregistrée.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">N° opération</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Libellé</th>
                <th className="px-5 py-3 text-right">Montant</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depenses.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{d.numeroOperation}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(d.date)}</td>
                  <td className="px-5 py-3 text-slate-900">{d.libelle}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatMontant(d.montant)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={d.statut === 'VALIDE' ? 'success' : 'default'}>{d.statut}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {d.statut === 'VALIDE' && (
                      <button
                        onClick={() => contrePasserMutation.mutate(d.id)}
                        className="text-xs text-red-600 underline"
                      >
                        Contre-passer
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
