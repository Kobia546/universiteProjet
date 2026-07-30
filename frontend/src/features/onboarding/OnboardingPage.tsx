import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { fetchFilieres, fetchAnneesUniversitaires } from '../programs/programsApi';
import { fetchReglesPaiement } from '../payment-rules/api/paymentRulesApi';
import { fetchEtudiants, fetchEtudiant } from '../students/api/studentsApi';
import { createOnboarding } from './api/onboardingApi';
import { formatMontant } from '../../shared/lib/format';
import type { Sexe, TypeEtudiant } from '../students/types';
import type { ModePaiement } from '../payments/api/paymentsApi';

const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const etudiantPreselectionne = searchParams.get('etudiantId') ?? '';

  // Mode : universitaire existant ou nouveau
  const [mode, setMode] = useState<'existant' | 'nouveau'>(
    etudiantPreselectionne ? 'existant' : 'nouveau',
  );

  // Recherche d'un universitaire existant
  const [recherche, setRecherche] = useState('');
  const [etudiantId, setEtudiantId] = useState(etudiantPreselectionne);

  const { data: etudiants } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants(recherche || undefined),
    enabled: !!recherche && mode === 'existant',
  });
  const { data: etudiantSelectionne } = useQuery({
    queryKey: ['etudiant', etudiantId],
    queryFn: () => fetchEtudiant(etudiantId),
    enabled: !!etudiantId && mode === 'existant',
  });

  // Nouvel universitaire
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<Sexe>('M');
  const [type, setType] = useState<TypeEtudiant>('ETUDIANT');
  // Date de naissance / lieu de naissance / adresse : masqués pour le moment
  // (pas nécessaires dans l'immédiat) — on garde une valeur par défaut
  // technique car la base l'exige encore, à retirer si besoin plus tard.
  const [dateNaissance] = useState('2000-01-01');
  const [lieuNaissance] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse] = useState('');

  // Inscription
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const [filiereId, setFiliereId] = useState('');

  // Paiement initial (optionnel)
  const [enregistrerPaiement, setEnregistrerPaiement] = useState(true);
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState("Frais d'inscription");
  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });
  const { data: regles } = useQuery({
    queryKey: ['regles-paiement', anneeUniversitaireId],
    queryFn: () => fetchReglesPaiement(anneeUniversitaireId),
    enabled: !!anneeUniversitaireId,
  });

  useEffect(() => {
    if (!anneeUniversitaireId && annees?.length) {
      const active = annees.find((a) => a.active) ?? annees[0];
      setAnneeUniversitaireId(active.id);
    }
  }, [annees, anneeUniversitaireId]);

  // Filières ouvertes pour l'année sélectionnée
  const filieresOuvertes = useMemo(() => {
    if (!anneeUniversitaireId || !filieres) return [];
    return filieres.filter((f) =>
      f.anneesOuvertes?.some((a) => a.anneeUniversitaireId === anneeUniversitaireId && a.actif),
    );
  }, [filieres, anneeUniversitaireId]);

  // Le type utilisé pour la suggestion de montant : celui de l'universitaire
  // existant sélectionné, ou celui choisi dans le formulaire du nouveau.
  const typeEffectif = mode === 'existant' ? etudiantSelectionne?.type ?? 'ETUDIANT' : type;

  // Suggestion du montant d'inscription, calculée côté client à partir des
  // règles de paiement déjà configurées (même logique de spécificité que le
  // backend : filière+type > filière seule > type seul > générale).
  const montantSuggere = useMemo(() => {
    if (!regles || !filiereId) return null;
    const candidates = regles.filter(
      (r) =>
        (r.filiereId === filiereId || r.filiereId === null) &&
        (r.type === typeEffectif || r.type === null),
    );
    const score = (r: (typeof candidates)[number]) => (r.filiereId ? 2 : 0) + (r.type ? 1 : 0);
    candidates.sort((a, b) => score(b) - score(a));
    const meilleure = candidates[0];
    if (!meilleure) return null;
    return Math.round((Number(meilleure.montantTotal) * meilleure.pourcentageInscription) / 100);
  }, [regles, filiereId, typeEffectif]);

  const mutation = useMutation({
    mutationFn: createOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      navigate('/inscriptions');
    },
  });

  const peutValider =
    (mode === 'existant' ? !!etudiantId : !!(nom && prenom)) &&
    filiereId &&
    anneeUniversitaireId &&
    (!enregistrerPaiement || (montant && Number(montant) > 0 && motif));

  function handleSubmit() {
    mutation.mutate({
      ...(mode === 'existant'
        ? { etudiantId }
        : {
            nom,
            prenom,
            sexe,
            type,
            dateNaissance,
            lieuNaissance: lieuNaissance || undefined,
            telephone: telephone || undefined,
            email: email || undefined,
            adresse: adresse || undefined,
          }),
      filiereId,
      anneeUniversitaireId,
      paiementInitial: enregistrerPaiement
        ? { montant: Number(montant), motif, modePaiement }
        : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Nouvelle inscription"
        description="Universitaire (nouveau ou existant), filière/année et premier paiement en une seule étape"
      />

      <div className="space-y-6">
        {/* ---- Choix : existant ou nouveau ---- */}
        {!etudiantPreselectionne && (
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            {(
              [
                { key: 'nouveau', label: 'Nouvel universitaire' },
                { key: 'existant', label: 'Universitaire existant' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setMode(tab.key);
                  setEtudiantId('');
                  setRecherche('');
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {mode === 'existant' ? (
          <Card className="p-6 sm:p-8">
            <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">
              Universitaire
            </h2>
            {!etudiantPreselectionne && (
              <Input
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
              />
            )}
            {!etudiantPreselectionne && recherche && etudiants && etudiants.length > 0 && !etudiantId && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {etudiants.map((etudiant) => (
                  <button
                    key={etudiant.id}
                    type="button"
                    onClick={() => {
                      setEtudiantId(etudiant.id);
                      setRecherche('');
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span>
                      {etudiant.prenom} {etudiant.nom}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{etudiant.matricule}</span>
                  </button>
                ))}
              </div>
            )}
            {etudiantSelectionne && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
                <span className="font-medium text-brand-900">
                  {etudiantSelectionne.prenom} {etudiantSelectionne.nom} —{' '}
                  <span className="font-mono text-xs">{etudiantSelectionne.matricule}</span>
                </span>
                {!etudiantPreselectionne && (
                  <button
                    type="button"
                    onClick={() => setEtudiantId('')}
                    className="text-xs text-brand-700 underline"
                  >
                    Changer
                  </button>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="font-serif text-[15px] font-semibold text-slate-900">
                Informations de l'universitaire
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
                <Input
                  label="Prénom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Sexe</label>
                  <select
                    value={sexe}
                    onChange={(e) => setSexe(e.target.value as Sexe)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TypeEtudiant)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ETUDIANT">Étudiant</option>
                    <option value="TRAVAILLEUR">Travailleur</option>
                  </select>
                </div>
                {/* Date de naissance — masquée pour le moment, pas nécessaire dans l'immédiat
                <Input
                  label="Date de naissance"
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  required
                />
                */}
              </div>
              {/* Lieu de naissance — masqué pour le moment
              <Input
                label="Lieu de naissance"
                value={lieuNaissance}
                onChange={(e) => setLieuNaissance(e.target.value)}
              />
              */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Téléphone"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* Adresse — masquée pour le moment
              <Input label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
              */}
            </div>
          </Card>
        )}

        {/* ---- Inscription ---- */}
        <Card className="p-6 sm:p-8">
          <h2 className="mb-4 font-serif text-[15px] font-semibold text-slate-900">Inscription</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Année universitaire</label>
              <select
                value={anneeUniversitaireId}
                onChange={(e) => {
                  setAnneeUniversitaireId(e.target.value);
                  setFiliereId('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sélectionner...</option>
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
                disabled={!anneeUniversitaireId}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50"
              >
                <option value="">
                  {!anneeUniversitaireId
                    ? "Choisir une année d'abord"
                    : filieresOuvertes.length === 0
                      ? 'Aucune filière ouverte pour cette année'
                      : 'Sélectionner...'}
                </option>
                {filieresOuvertes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.libelle}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* ---- Paiement initial ---- */}
        <Card className="p-6 sm:p-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-serif text-[15px] font-semibold text-slate-900">Premier paiement</h2>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={enregistrerPaiement}
                onChange={(e) => setEnregistrerPaiement(e.target.checked)}
              />
              Enregistrer un paiement maintenant
            </label>
          </div>

          {enregistrerPaiement && (
            <div className="space-y-4">
              {montantSuggere !== null && (
                <button
                  type="button"
                  onClick={() => setMontant(String(montantSuggere))}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  Montant suggéré (règle configurée) — {formatMontant(montantSuggere)}
                </button>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Montant"
                  type="number"
                  min="0"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Mode de paiement</label>
                  <select
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {MODES_PAIEMENT.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input label="Motif" value={motif} onChange={(e) => setMotif(e.target.value)} />
            </div>
          )}
        </Card>

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {(mutation.error as any)?.response?.data?.message ||
              'Une erreur est survenue. Vérifiez qu’une règle de paiement est configurée pour cette filière/type/année.'}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate('/inscriptions')}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!peutValider}
            isLoading={mutation.isPending}
            onClick={handleSubmit}
          >
            Créer l'inscription{enregistrerPaiement ? ' et enregistrer le paiement' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
