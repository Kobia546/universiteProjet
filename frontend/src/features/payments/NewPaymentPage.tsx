import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { fetchEtudiants, fetchEtudiant } from '../students/api/studentsApi';
import { fetchInscription } from '../enrollments/api/enrollmentsApi';
import { createPaiement, type ModePaiement } from './api/paymentsApi';
import { BANQUES_COTE_DIVOIRE } from '../../shared/data/banques';
import { formatMontant } from '../../shared/lib/format';

const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CHEQUE', label: 'Chèque' },
];

export function NewPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Pré-sélection possible depuis un lien "Payer" (fiche étudiant ou
  // fiche inscription) : ?inscriptionId=... — dans ce cas on saute la
  // recherche, tout est déjà rempli.
  const inscriptionPreselectionnee = searchParams.get('inscriptionId') ?? '';

  const [recherche, setRecherche] = useState('');
  const [etudiantId, setEtudiantId] = useState('');
  const [inscriptionId, setInscriptionId] = useState(inscriptionPreselectionnee);
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');
  const [numeroRecu, setNumeroRecu] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [banque, setBanque] = useState('');

  const { data: etudiants } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants({ recherche: recherche || undefined }),
    enabled: !!recherche,
  });

  const etudiantSelectionneListe = etudiants?.find((e) => e.id === etudiantId);

  const { data: etudiantDetail } = useQuery({
    queryKey: ['etudiant', etudiantId],
    queryFn: () => fetchEtudiant(etudiantId),
    enabled: !!etudiantId,
  });

  const { data: inscriptionDetail } = useQuery({
    queryKey: ['inscription', inscriptionId],
    queryFn: () => fetchInscription(inscriptionId),
    enabled: !!inscriptionId,
  });

  // Si on arrive avec ?inscriptionId=..., on déduit l'étudiant depuis
  // l'inscription elle-même, sans passer par la recherche manuelle.
  useEffect(() => {
    if (inscriptionPreselectionnee && inscriptionDetail && !etudiantId) {
      setEtudiantId(inscriptionDetail.etudiant.id);
    }
  }, [inscriptionPreselectionnee, inscriptionDetail, etudiantId]);

  const totalPaye =
    inscriptionDetail?.paiements
      ?.filter((p) => p.statut === 'VALIDE')
      .reduce((s, p) => s + Number(p.montant), 0) ?? 0;
  const soldeRestant = inscriptionDetail
    ? Number(inscriptionDetail.montantTotalDu) - totalPaye
    : null;
  const dejaSoldee = soldeRestant !== null && soldeRestant <= 0;

  // Montant suggéré pour "solder la prochaine échéance" : cumul dû jusqu'à la
  // première échéance non soldée, moins ce qui a déjà été payé. Couvre aussi
  // le cas d'un rattrapage si une échéance précédente n'était que partielle.
  let montantProchaineEcheance: number | null = null;
  let cumulDu = 0;
  for (const echeance of inscriptionDetail?.echeances ?? []) {
    cumulDu += Number(echeance.montantPrevu);
    if (echeance.statut !== 'SOLDE') {
      montantProchaineEcheance = cumulDu - totalPaye;
      break;
    }
  }

  const mutation = useMutation({
    mutationFn: createPaiement,
    onSuccess: (paiement) => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
      queryClient.invalidateQueries({ queryKey: ['inscription', inscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['etudiant', etudiantId] });
      navigate(`/paiements/${paiement.id}`);
    },
  });

  const peutValider =
    inscriptionId &&
    montant &&
    Number(montant) > 0 &&
    numeroRecu &&
    (modePaiement !== 'CHEQUE' || numeroCheque);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouveau paiement" description="Enregistrer un paiement et générer le reçu" />

      <Card className="space-y-6">
        {/* Étudiant — masqué si on arrive déjà avec une inscription précise */}
        {!inscriptionPreselectionnee && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Étudiant / Travailleur
            </label>
            <Input
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            {recherche && etudiants && etudiants.length > 0 && !etudiantId && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {etudiants.map((etudiant) => (
                  <button
                    key={etudiant.id}
                    type="button"
                    onClick={() => {
                      setEtudiantId(etudiant.id);
                      setInscriptionId('');
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
            {etudiantId && (etudiantDetail || etudiantSelectionneListe) && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm">
                <span className="font-medium text-brand-900">
                  {(etudiantDetail ?? etudiantSelectionneListe)!.prenom}{' '}
                  {(etudiantDetail ?? etudiantSelectionneListe)!.nom}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEtudiantId('');
                    setInscriptionId('');
                  }}
                  className="text-xs text-brand-700 underline"
                >
                  Changer
                </button>
              </div>
            )}
          </div>
        )}

        {inscriptionPreselectionnee && etudiantDetail && (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm">
            <span className="font-medium text-brand-900">
              {etudiantDetail.prenom} {etudiantDetail.nom}
            </span>
            <span className="ml-2 font-mono text-xs text-brand-600">
              {etudiantDetail.matricule}
            </span>
          </div>
        )}

        {/* Inscription (à choisir parmi celles de l'étudiant, sauf si déjà imposée par l'URL) */}
        {etudiantDetail && !inscriptionPreselectionnee && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Inscription</label>
            <select
              value={inscriptionId}
              onChange={(e) => setInscriptionId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Sélectionner...</option>
              {etudiantDetail.inscriptions?.map((inscription) => (
                <option key={inscription.id} value={inscription.id}>
                  {inscription.filiere?.libelle} (
                  {inscription.anneeUniversitaire?.libelle})
                </option>
              ))}
            </select>
            {etudiantDetail.inscriptions?.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Cet étudiant n'a aucune inscription. Créez-en une d'abord.
              </p>
            )}
          </div>
        )}

        {inscriptionPreselectionnee && inscriptionDetail && (
          <div className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700">
            Inscription : <span className="font-medium">{inscriptionDetail.filiere.libelle}</span>{' '}
            ({inscriptionDetail.anneeUniversitaire.libelle}) — N°{' '}
            {inscriptionDetail.numeroInscription}
          </div>
        )}

        {dejaSoldee && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Cette inscription est déjà entièrement soldée — aucun paiement n'est requis. Tu peux
            quand même en enregistrer un si c'est exceptionnel (avance sur l'année suivante, etc.).
          </div>
        )}

        {soldeRestant !== null && !dejaSoldee && (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Solde restant dû : </span>
            <span className="font-semibold text-slate-900">{formatMontant(soldeRestant)}</span>
          </div>
        )}

        {soldeRestant !== null && soldeRestant > 0 && (
          <div className="flex flex-wrap gap-2">
            {montantProchaineEcheance !== null && montantProchaineEcheance > 0 && (
              <button
                type="button"
                onClick={() => setMontant(String(montantProchaineEcheance))}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                Prochaine échéance — {formatMontant(montantProchaineEcheance)}
              </button>
            )}
            <button
              type="button"
              onClick={() => setMontant(String(soldeRestant))}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Solder tout — {formatMontant(soldeRestant)}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Montant"
            type="number"
            min="0"
            step="1"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Ou saisissez un montant personnalisé"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Mode de paiement</label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {MODES_PAIEMENT.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Motif"
          placeholder="Ex : Frais d'inscription, 2e tranche, ..."
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Numéro de reçu (carnet papier)"
              type="number"
              min="1"
              value={numeroRecu}
              onChange={(e) => setNumeroRecu(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Le numéro exact écrit sur le reçu physique remis à la personne.
            </p>
          </div>
        </div>
        {modePaiement === 'CHEQUE' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Banque</label>
              <select
                value={banque}
                onChange={(e) => setBanque(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sélectionner...</option>
                {BANQUES_COTE_DIVOIRE.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Numéro de chèque"
              value={numeroCheque}
              onChange={(e) => setNumeroCheque(e.target.value)}
              required
            />
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-600">
            Une erreur est survenue lors de l'enregistrement du paiement.
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/paiements')}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!peutValider}
            isLoading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                inscriptionId,
                montant: Number(montant),
                motif,
                modePaiement,
                numeroRecu: Number(numeroRecu),
                numeroCheque: modePaiement === 'CHEQUE' ? numeroCheque : undefined,
                banque: modePaiement === 'CHEQUE' ? banque || undefined : undefined,
              })
            }
          >
            Enregistrer le paiement
          </Button>
        </div>
      </Card>
    </div>
  );
}
