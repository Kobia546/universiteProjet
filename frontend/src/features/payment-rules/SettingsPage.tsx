import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { Badge } from '../../shared/components/ui/Badge';
import {
  fetchFilieres,
  createFiliere,
  fetchNiveaux,
  ouvrirNiveau,
  fetchAnneesUniversitaires,
  createAnneeUniversitaire,
  activerAnneeUniversitaire,
} from '../programs/programsApi';
import {
  fetchReglesPaiement,
  createReglePaiement,
  updateReglePaiement,
  deleteReglePaiement,
} from './api/paymentRulesApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

type Onglet = 'filieres' | 'annees' | 'regles';

export function SettingsPage() {
  const [onglet, setOnglet] = useState<Onglet>('filieres');

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration académique et financière" />

      <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'filieres', label: 'Filières & niveaux' },
            { key: 'annees', label: 'Années universitaires' },
            { key: 'regles', label: 'Règles de paiement' },
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

      {onglet === 'filieres' && <FilieresTab />}
      {onglet === 'annees' && <AnneesTab />}
      {onglet === 'regles' && <ReglesTab />}
    </div>
  );
}

function FilieresTab() {
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const queryClient = useQueryClient();

  const { data: filieres, isLoading } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });
  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const anneeActive = annees?.find((a) => a.active);

  const creerMutation = useMutation({
    mutationFn: createFiliere,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filieres'] });
      setNom('');
      setCode('');
    },
  });

  const ouvrirMutation = useMutation({
    mutationFn: ouvrirNiveau,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filieres'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-serif text-[15px] font-semibold text-slate-900">Nouvelle filière</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="w-32">
            <Input
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <Button
            disabled={!nom || !code}
            isLoading={creerMutation.isPending}
            onClick={() => creerMutation.mutate({ nom, code })}
          >
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </div>
      </Card>

      {!anneeActive && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Aucune année universitaire active — activez-en une dans l'onglet "Années universitaires"
          avant d'ouvrir des niveaux.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {filieres?.map((filiere) => {
            const niveauxOuvertsIds = new Set(
              (filiere.filiereNiveaux || [])
                .filter((fn) => fn.actif && fn.anneeUniversitaireId === anneeActive?.id)
                .map((fn) => fn.niveauId),
            );
            return (
              <Card key={filiere.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{filiere.nom}</p>
                    <p className="text-xs text-slate-500">Code : {filiere.code}</p>
                  </div>
                  {!filiere.actif && <Badge variant="default">Inactive</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {niveaux?.map((niveau) => {
                    const estOuvert = niveauxOuvertsIds.has(niveau.id);
                    return (
                      <button
                        key={niveau.id}
                        disabled={!anneeActive || estOuvert}
                        onClick={() =>
                          anneeActive &&
                          ouvrirMutation.mutate({
                            filiereId: filiere.id,
                            niveauId: niveau.id,
                            anneeUniversitaireId: anneeActive.id,
                          })
                        }
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          estOuvert
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50'
                        }`}
                      >
                        {estOuvert && <Check className="h-3 w-3" />}
                        {niveau.code}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnneesTab() {
  const [libelle, setLibelle] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const queryClient = useQueryClient();

  const { data: annees, isLoading } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  const creerMutation = useMutation({
    mutationFn: createAnneeUniversitaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annees-universitaires'] });
      setLibelle('');
      setDateDebut('');
      setDateFin('');
    },
  });

  const activerMutation = useMutation({
    mutationFn: activerAnneeUniversitaire,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annees-universitaires'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-serif text-[15px] font-semibold text-slate-900">Nouvelle année universitaire</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Input
              label="Libellé"
              placeholder="2026-2027"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
            />
          </div>
          <Input
            label="Début"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
          />
          <Input
            label="Fin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
          />
          <Button
            disabled={!libelle || !dateDebut || !dateFin}
            isLoading={creerMutation.isPending}
            onClick={() => creerMutation.mutate({ libelle, dateDebut, dateFin })}
          >
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Libellé</th>
                <th className="px-5 py-3">Début</th>
                <th className="px-5 py-3">Fin</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {annees?.map((annee) => (
                <tr key={annee.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">{annee.libelle}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(annee.dateDebut)}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(annee.dateFin)}</td>
                  <td className="px-5 py-3">
                    {annee.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {!annee.active && (
                      <button
                        onClick={() => activerMutation.mutate(annee.id)}
                        className="text-xs text-brand-700 underline"
                      >
                        Activer
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

function ReglesTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filiereId, setFiliereId] = useState('');
  const [niveauId, setNiveauId] = useState('');
  const [montantTotal, setMontantTotal] = useState('');
  const [pourcentageInscription, setPourcentageInscription] = useState('60');
  const [nombreEcheances, setNombreEcheances] = useState('3');
  const queryClient = useQueryClient();

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const anneeActive = annees?.find((a) => a.active) ?? annees?.[0];

  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });
  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: regles, isLoading } = useQuery({
    queryKey: ['regles-paiement', anneeActive?.id],
    queryFn: () => fetchReglesPaiement(anneeActive?.id),
    enabled: !!anneeActive,
  });

  function reinitialiserFormulaire() {
    setEditingId(null);
    setFiliereId('');
    setNiveauId('');
    setMontantTotal('');
    setPourcentageInscription('60');
    setNombreEcheances('3');
  }

  function commencerEdition(regle: NonNullable<typeof regles>[number]) {
    setEditingId(regle.id);
    setFiliereId(regle.filiereId ?? '');
    setNiveauId(regle.niveauId ?? '');
    setMontantTotal(String(regle.montantTotal));
    setPourcentageInscription(String(regle.pourcentageInscription));
    setNombreEcheances(String(regle.nombreEcheances));
  }

  const creerMutation = useMutation({
    mutationFn: createReglePaiement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
      reinitialiserFormulaire();
    },
  });

  const modifierMutation = useMutation({
    mutationFn: (input: Parameters<typeof updateReglePaiement>[1]) =>
      updateReglePaiement(editingId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regles-paiement'] });
      reinitialiserFormulaire();
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: deleteReglePaiement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regles-paiement'] }),
  });

  const enEdition = !!editingId;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {enEdition ? 'Modifier la règle de paiement' : 'Nouvelle règle de paiement'}
          </h2>
          {enEdition && (
            <button
              onClick={reinitialiserFormulaire}
              className="text-xs text-slate-500 underline"
            >
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Laissez filière et/ou niveau vides pour une règle générale. La règle la plus spécifique
          (filière + niveau) prime automatiquement sur une règle générale.
          {anneeActive && ` S'applique à l'année ${anneeActive.libelle}.`}
          {enEdition && (
            <span className="ml-1 font-medium text-amber-600">
              Attention : modifier cette règle ne change pas rétroactivement les inscriptions déjà
              créées avec l'ancienne valeur.
            </span>
          )}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Filière (optionnel)</label>
            <select
              value={filiereId}
              onChange={(e) => setFiliereId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les filières</option>
              {filieres?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Niveau (optionnel)</label>
            <select
              value={niveauId}
              onChange={(e) => setNiveauId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Tous les niveaux</option>
              {niveaux?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.libelle}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Montant total"
            type="number"
            min="0"
            value={montantTotal}
            onChange={(e) => setMontantTotal(e.target.value)}
          />
          <Input
            label="% à l'inscription"
            type="number"
            min="0"
            max="100"
            value={pourcentageInscription}
            onChange={(e) => setPourcentageInscription(e.target.value)}
          />
          <Input
            label="Nombre d'échéances (dont inscription)"
            type="number"
            min="1"
            value={nombreEcheances}
            onChange={(e) => setNombreEcheances(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          {enEdition ? (
            <Button
              disabled={!montantTotal}
              isLoading={modifierMutation.isPending}
              onClick={() =>
                modifierMutation.mutate({
                  filiereId: filiereId || undefined,
                  niveauId: niveauId || undefined,
                  montantTotal: Number(montantTotal),
                  pourcentageInscription: Number(pourcentageInscription),
                  nombreEcheances: Number(nombreEcheances),
                })
              }
            >
              Enregistrer les modifications
            </Button>
          ) : (
            <Button
              disabled={!montantTotal || !anneeActive}
              isLoading={creerMutation.isPending}
              onClick={() =>
                anneeActive &&
                creerMutation.mutate({
                  filiereId: filiereId || undefined,
                  niveauId: niveauId || undefined,
                  anneeUniversitaireId: anneeActive.id,
                  montantTotal: Number(montantTotal),
                  pourcentageInscription: Number(pourcentageInscription),
                  nombreEcheances: Number(nombreEcheances),
                })
              }
            >
              <Plus className="h-4 w-4" />
              Créer la règle
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !regles || regles.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune règle configurée pour cette année.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Filière</th>
                <th className="px-5 py-3">Niveau</th>
                <th className="px-5 py-3 text-right">Montant total</th>
                <th className="px-5 py-3 text-right">% inscription</th>
                <th className="px-5 py-3 text-right">Échéances</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regles.map((regle) => (
                <tr key={regle.id} className={editingId === regle.id ? 'bg-brand-50/50' : ''}>
                  <td className="px-5 py-3">{regle.filiere?.nom ?? 'Toutes'}</td>
                  <td className="px-5 py-3">{regle.niveau?.code ?? 'Tous'}</td>
                  <td className="px-5 py-3 text-right font-medium">
                    {formatMontant(regle.montantTotal)}
                  </td>
                  <td className="px-5 py-3 text-right">{regle.pourcentageInscription}%</td>
                  <td className="px-5 py-3 text-right">{regle.nombreEcheances}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => commencerEdition(regle)}
                        className="text-xs text-brand-700 underline"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => supprimerMutation.mutate(regle.id)}
                        className="text-xs text-red-600 underline"
                      >
                        Supprimer
                      </button>
                    </div>
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
