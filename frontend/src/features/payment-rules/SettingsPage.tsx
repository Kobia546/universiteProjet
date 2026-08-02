import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Link2, X } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { Badge } from '../../shared/components/ui/Badge';
import {
  fetchFilieres,
  ouvrirFiliere,
  fermerFiliere,
  fetchMatieres,
  createMatiere,
  deleteMatiere,
  rattacherMatiere,
  detacherMatiere,
  fetchAnneesUniversitaires,
  createAnneeUniversitaire,
  activerAnneeUniversitaire,
} from '../programs/programsApi';
import {
  fetchReglesPaiement,
  createReglePaiement,
  updateReglePaiement,
  deleteReglePaiement,
  type TypeEtudiant,
} from './api/paymentRulesApi';
import { fetchCarnetsRecu, createCarnetRecu, fermerCarnetRecu } from './api/carnetRecuApi';
import { formatDate, formatMontant } from '../../shared/lib/format';

type Onglet = 'filieres' | 'matieres' | 'annees' | 'regles' | 'carnets';

export function SettingsPage() {
  const [onglet, setOnglet] = useState<Onglet>('filieres');

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration académique et financière" />

      <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'filieres', label: 'Filières (L1-M2)' },
            { key: 'matieres', label: 'Matières' },
            { key: 'annees', label: 'Années universitaires' },
            { key: 'regles', label: 'Règles de paiement' },
            { key: 'carnets', label: 'Carnets de reçu' },
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
      {onglet === 'matieres' && <MatieresTab />}
      {onglet === 'annees' && <AnneesTab />}
      {onglet === 'regles' && <ReglesTab />}
      {onglet === 'carnets' && <CarnetsRecuTab />}
    </div>
  );
}

function FilieresTab() {
  const queryClient = useQueryClient();
  const { data: filieres, isLoading } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });
  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const anneeActive = annees?.find((a) => a.active) ?? annees?.[0];

  const ouvrirMutation = useMutation({
    mutationFn: ouvrirFiliere,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filieres'] }),
  });
  const fermerMutation = useMutation({
    mutationFn: fermerFiliere,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['filieres'] }),
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Les filières (L1 à M2) sont un référentiel fixe. Il suffit d'ouvrir celles qui accueillent
        des inscriptions pour l'année universitaire en cours.
        {anneeActive && ` Année concernée : ${anneeActive.libelle}.`}
      </p>

      {!anneeActive && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Aucune année universitaire active — activez-en une dans l'onglet "Années universitaires".
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {filieres?.map((filiere) => {
            const ouverture = filiere.anneesOuvertes?.find(
              (a) => a.anneeUniversitaireId === anneeActive?.id,
            );
            const estOuverte = ouverture?.actif ?? false;
            return (
              <Card key={filiere.id} className="text-center">
                <p className="font-serif text-lg font-semibold text-slate-900">{filiere.code}</p>
                <p className="mb-3 text-xs text-slate-500">{filiere.libelle}</p>
                {estOuverte ? (
                  <button
                    onClick={() => ouverture && fermerMutation.mutate(ouverture.id)}
                    className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                  >
                    <Check className="h-3 w-3" />
                    Ouverte
                  </button>
                ) : (
                  <button
                    disabled={!anneeActive}
                    onClick={() =>
                      anneeActive &&
                      ouvrirMutation.mutate({
                        filiereId: filiere.id,
                        anneeUniversitaireId: anneeActive.id,
                      })
                    }
                    className="w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Fermée — ouvrir
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatieresTab() {
  const [nom, setNom] = useState('');
  const [code, setCode] = useState('');
  const [filiereSelectionnee, setFiliereSelectionnee] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: matieres, isLoading } = useQuery({ queryKey: ['matieres'], queryFn: fetchMatieres });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });

  const creerMutation = useMutation({
    mutationFn: createMatiere,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matieres'] });
      setNom('');
      setCode('');
    },
  });
  const supprimerMutation = useMutation({
    mutationFn: deleteMatiere,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matieres'] }),
  });
  const rattacherMutation = useMutation({
    mutationFn: rattacherMatiere,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matieres'] }),
  });
  const detacherMutation = useMutation({
    mutationFn: detacherMatiere,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matieres'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
          Nouvelle matière
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Catalogue informatif des modules enseignés — une matière peut être rattachée à plusieurs
          filières. N'affecte pas les inscriptions ni les paiements.
        </p>
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

      {isLoading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {matieres?.map((matiere) => {
            const filieresRattachees = new Set(matiere.filieres?.map((f) => f.filiereId));
            const filiereAAjouter = filiereSelectionnee[matiere.id] ?? '';
            return (
              <Card key={matiere.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{matiere.nom}</p>
                    <p className="text-xs text-slate-500">Code : {matiere.code}</p>
                  </div>
                  <button
                    onClick={() => supprimerMutation.mutate(matiere.id)}
                    className="text-xs text-red-600 underline"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {matiere.filieres?.map((rattachement) => (
                    <span
                      key={rattachement.id}
                      className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                    >
                      {rattachement.filiere.code}
                      <button
                        onClick={() => detacherMutation.mutate(rattachement.id)}
                        className="text-brand-400 hover:text-brand-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filiereAAjouter}
                    onChange={(e) =>
                      setFiliereSelectionnee((s) => ({ ...s, [matiere.id]: e.target.value }))
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Rattacher à une filière...</option>
                    {filieres
                      ?.filter((f) => !filieresRattachees.has(f.id))
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.code}
                        </option>
                      ))}
                  </select>
                  <button
                    disabled={!filiereAAjouter}
                    onClick={() => {
                      rattacherMutation.mutate({ filiereId: filiereAAjouter, matiereId: matiere.id });
                      setFiliereSelectionnee((s) => ({ ...s, [matiere.id]: '' }));
                    }}
                    className="flex items-center gap-1 text-xs font-medium text-brand-700 disabled:opacity-40"
                  >
                    <Link2 className="h-3 w-3" />
                    Rattacher
                  </button>
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
        <h2 className="mb-3 font-serif text-[15px] font-semibold text-slate-900">
          Nouvelle année universitaire
        </h2>
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
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
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
  const [type, setType] = useState<TypeEtudiant | ''>('');
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
  const { data: regles, isLoading } = useQuery({
    queryKey: ['regles-paiement', anneeActive?.id],
    queryFn: () => fetchReglesPaiement(anneeActive?.id),
    enabled: !!anneeActive,
  });

  function reinitialiserFormulaire() {
    setEditingId(null);
    setFiliereId('');
    setType('');
    setMontantTotal('');
    setPourcentageInscription('60');
    setNombreEcheances('3');
  }

  function commencerEdition(regle: NonNullable<typeof regles>[number]) {
    setEditingId(regle.id);
    setFiliereId(regle.filiereId ?? '');
    setType(regle.type ?? '');
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
          <h2 className="font-serif text-[15px] font-semibold text-slate-900">
            {enEdition ? 'Modifier la règle de paiement' : 'Nouvelle règle de paiement'}
          </h2>
          {enEdition && (
            <button onClick={reinitialiserFormulaire} className="text-xs text-slate-500 underline">
              Annuler la modification
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Laissez filière et/ou type vides pour une règle plus générale. La règle la plus
          spécifique (filière + type) prime automatiquement.
          {anneeActive && ` S'applique à l'année ${anneeActive.libelle}.`}
          {enEdition && (
            <span className="ml-1 font-medium text-amber-600">
              Modifier cette règle ne change pas rétroactivement les inscriptions déjà créées.
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
                  {f.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Type (optionnel)</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TypeEtudiant | '')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Étudiants et travailleurs</option>
              <option value="ETUDIANT">Étudiant uniquement</option>
              <option value="TRAVAILLEUR">Travailleur uniquement</option>
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
                  type: type || undefined,
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
                  type: type || undefined,
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
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Montant total</th>
                <th className="px-5 py-3 text-right">% inscription</th>
                <th className="px-5 py-3 text-right">Échéances</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regles.map((regle) => (
                <tr key={regle.id} className={editingId === regle.id ? 'bg-brand-50/50' : ''}>
                  <td className="px-5 py-3">{regle.filiere?.libelle ?? 'Toutes'}</td>
                  <td className="px-5 py-3">
                    {regle.type === 'ETUDIANT'
                      ? 'Étudiant'
                      : regle.type === 'TRAVAILLEUR'
                        ? 'Travailleur'
                        : 'Tous'}
                  </td>
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

function CarnetsRecuTab() {
  const [numeroDebut, setNumeroDebut] = useState('');
  const [numeroFin, setNumeroFin] = useState('');
  const queryClient = useQueryClient();

  const { data: carnets, isLoading } = useQuery({
    queryKey: ['carnets-recu'],
    queryFn: fetchCarnetsRecu,
  });

  const creerMutation = useMutation({
    mutationFn: createCarnetRecu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carnets-recu'] });
      setNumeroDebut('');
      setNumeroFin('');
    },
  });

  const fermerMutation = useMutation({
    mutationFn: fermerCarnetRecu,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carnets-recu'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
          Nouveau carnet (plage de numéros)
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Définis la plage de numéros que couvre un carnet physique (ex : 90 à 95). Au moment d'un
          paiement, le comptable saisit le numéro exact du reçu papier utilisé — l'app vérifie
          qu'il appartient bien à une plage configurée ici, pour éviter les numéros inventés ou mal
          tapés.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Numéro de début"
            type="number"
            min="1"
            value={numeroDebut}
            onChange={(e) => setNumeroDebut(e.target.value)}
          />
          <Input
            label="Numéro de fin"
            type="number"
            min="1"
            value={numeroFin}
            onChange={(e) => setNumeroFin(e.target.value)}
          />
        </div>
        {creerMutation.isError && (
          <p className="mt-3 text-sm text-red-600">
            {(creerMutation.error as any)?.response?.data?.message ||
              'Une erreur est survenue.'}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!numeroDebut || !numeroFin}
            isLoading={creerMutation.isPending}
            onClick={() =>
              creerMutation.mutate({
                numeroDebut: Number(numeroDebut),
                numeroFin: Number(numeroFin),
              })
            }
          >
            <Plus className="h-4 w-4" />
            Créer le carnet
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !carnets || carnets.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            Aucun carnet configuré — un paiement ne pourra pas être enregistré tant qu'aucune plage
            n'existe.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Plage</th>
                  <th className="px-5 py-3 text-right">Nombre de reçus</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Créé le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carnets.map((carnet) => (
                  <tr key={carnet.id}>
                    <td className="px-5 py-3 font-mono text-sm font-medium text-slate-900">
                      {carnet.numeroDebut} — {carnet.numeroFin}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {carnet.numeroFin - carnet.numeroDebut + 1}
                    </td>
                    <td className="px-5 py-3">
                      {carnet.actif ? (
                        <Badge variant="success">Actif</Badge>
                      ) : (
                        <Badge variant="default">Fermé</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(carnet.createdAt)}</td>
                    <td className="px-5 py-3">
                      {carnet.actif && (
                        <button
                          onClick={() => fermerMutation.mutate(carnet.id)}
                          className="text-xs text-red-600 underline"
                        >
                          Fermer
                        </button>
                      )}
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
