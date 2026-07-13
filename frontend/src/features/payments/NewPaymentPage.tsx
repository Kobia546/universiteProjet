import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { fetchEtudiants, fetchEtudiant } from '../students/api/studentsApi';
import { fetchInscription } from '../enrollments/api/enrollmentsApi';
import { createPaiement, type ModePaiement } from './api/paymentsApi';
import { formatMontant } from '../../shared/lib/format';

const MODES_PAIEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

export function NewPaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [recherche, setRecherche] = useState('');
  const [etudiantId, setEtudiantId] = useState('');
  const [inscriptionId, setInscriptionId] = useState('');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('ESPECES');

  const { data: etudiants } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants(recherche || undefined),
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

  const totalPaye =
    inscriptionDetail?.paiements
      ?.filter((p) => p.statut === 'VALIDE')
      .reduce((s, p) => s + Number(p.montant), 0) ?? 0;
  const soldeRestant = inscriptionDetail
    ? Number(inscriptionDetail.montantTotalDu) - totalPaye
    : null;

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
      navigate(`/paiements/${paiement.id}`);
    },
  });

  const peutValider = inscriptionId && montant && motif && Number(montant) > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouveau paiement" description="Enregistrer un paiement et générer le reçu" />

      <Card className="space-y-6">
        {/* Étudiant */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Étudiant</label>
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

        {/* Inscription (à choisir parmi celles de l'étudiant) */}
        {etudiantDetail && (
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
                  {inscription.filiere?.nom} — {inscription.niveau?.code} (
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

        {soldeRestant !== null && (
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
