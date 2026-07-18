import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Printer, Ban } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { fetchPaiement, annulerPaiement } from './api/paymentsApi';
import { formatDate, formatDateHeure, formatMontant } from '../../shared/lib/format';
import { montantEnLettres } from '../../shared/lib/montantEnLettres';

export function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: paiement, isLoading } = useQuery({
    queryKey: ['paiement', id],
    queryFn: () => fetchPaiement(id!),
    enabled: !!id,
  });

  const annulerMutation = useMutation({
    mutationFn: () => annulerPaiement(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiement', id] });
      queryClient.invalidateQueries({ queryKey: ['paiements'] });
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!paiement) return <p className="text-sm text-slate-500">Paiement introuvable.</p>;

  const echeances = paiement.inscription.echeances ?? [];
  const totalPaye =
    paiement.inscription.paiements
      ?.filter((p) => p.statut === 'VALIDE')
      .reduce((s, p) => s + Number(p.montant), 0) ?? Number(paiement.montant);
  const resteAPayer = Number(paiement.inscription.montantTotalDu) - totalPaye;
  const prochaineEcheance = echeances.find((e) => e.statut !== 'SOLDE');

  return (
    <div>
      <PageHeader
        title={`Reçu N° ${paiement.recu?.numeroRecu ?? '—'}`}
        description={`${paiement.etudiant.prenom} ${paiement.etudiant.nom} — ${formatDateHeure(paiement.datePaiement)}`}
        action={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
            {paiement.statut === 'VALIDE' && (
              <Button
                variant="danger"
                isLoading={annulerMutation.isPending}
                onClick={() => {
                  if (
                    confirm(
                      "Confirmer l'annulation de ce paiement ? Cette action est tracée et ne peut pas être défaite depuis l'interface.",
                    )
                  ) {
                    annulerMutation.mutate();
                  }
                }}
              >
                <Ban className="h-4 w-4" />
                Annuler le paiement
              </Button>
            )}
          </div>
        }
      />

      {paiement.statut === 'ANNULE' && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          Ce paiement a été annulé. L'écriture comptable associée a été contre-passée.
        </div>
      )}

      {/* Reçu imprimable, mise en page façon carnet de reçus papier */}
      <Card className="mx-auto max-w-2xl border-2 border-slate-800/10 print:border-none print:shadow-none">
        {/* En-tête */}
        <div className="mb-4 flex items-start justify-between border-b-2 border-dashed border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/logos/universite.png"
              alt="Université Félix Houphouët-Boigny"
              className="h-14 w-14 shrink-0 object-contain"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                Filières Professionnalisées UFR SJAP
              </p>
              <p className="text-xs text-slate-500">BP V179</p>
              <p className="text-xs text-slate-500">Cel. : 01 41 03 17 24 / 01 40 83 56 52</p>
            </div>
          </div>
          <img
            src="/logos/ufr-sjap.png"
            alt="UFR SJAP"
            className="h-14 w-14 shrink-0 object-contain"
          />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Reçu{' '}
            <span className="font-mono text-red-600">
              N° {paiement.recu?.numeroRecu ?? '—'}
            </span>
          </h2>
          <Badge variant={paiement.statut === 'VALIDE' ? 'success' : 'danger'}>
            {paiement.statut}
          </Badge>
        </div>

        <div className="mb-6 flex justify-end border-b border-dotted border-slate-300 pb-2 text-xs text-slate-400">
          B.P.F. : ..........................................
        </div>

        <dl className="space-y-3 text-sm">
          <ChampLigne
            label="Reçu de M./Mme"
            valeur={`${paiement.etudiant.prenom} ${paiement.etudiant.nom}`}
          />
          <ChampLigne label="Matricule" valeur={paiement.etudiant.matricule} mono />
          <div className="border-b border-dotted border-slate-300 pb-2">
            <dt className="mb-1 text-slate-500">La somme de</dt>
            <dd className="italic text-slate-900">
              {montantEnLettres(Number(paiement.montant))}
              <span className="ml-2 not-italic font-semibold">
                ({formatMontant(paiement.montant)})
              </span>
            </dd>
          </div>
          <ChampLigne label="En règlement de" valeur={paiement.motif} />
          <ChampLigne
            label="Année d'études"
            valeur={`${paiement.inscription.filiere.libelle} — ${paiement.inscription.anneeUniversitaire?.libelle ?? ''}`}
          />

          <div className="flex items-center gap-6 border-b border-dotted border-slate-300 pb-3 pt-1">
            <CaseACocher label="Espèces" coche={paiement.modePaiement === 'ESPECES'} />
            <CaseACocher
              label={paiement.modePaiement === 'CHEQUE' ? 'Chèque' : 'Autre mode'}
              coche={paiement.modePaiement !== 'ESPECES'}
            />
            {paiement.modePaiement !== 'ESPECES' && (
              <span className="text-xs text-slate-500">({paiement.modePaiement})</span>
            )}
            <span className="ml-auto text-xs text-slate-500">
              Date : {formatDate(paiement.datePaiement)}
            </span>
          </div>

          <ChampLigne
            label="Reste à payer"
            valeur={formatMontant(Math.max(resteAPayer, 0))}
            accent
          />

          {paiement.estPaiementSoldant && (
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 py-2 text-sm font-semibold text-emerald-700">
              ✓ Ce paiement solde entièrement l'inscription
            </div>
          )}

          {prochaineEcheance ? (
            <>
              <ChampLigne
                label="Montant prochain versement"
                valeur={formatMontant(prochaineEcheance.montantPrevu)}
              />
              <ChampLigne
                label="Date prochain versement"
                valeur={formatDate(prochaineEcheance.dateLimite)}
              />
            </>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              Inscription entièrement soldée — aucun prochain versement.
            </p>
          )}
        </dl>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="border-t border-slate-300 pt-1 text-xs italic text-slate-500">
              Signature et Cachet
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>
              Agent : {paiement.agent.prenom} {paiement.agent.nom}
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs italic text-slate-400">
          N.B : Aucun remboursement n'est possible après versement
        </p>
      </Card>
    </div>
  );
}

function ChampLigne({
  label,
  valeur,
  mono,
  accent,
}: {
  label: string;
  valeur: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-dotted border-slate-300 pb-1.5">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={`text-right ${mono ? 'font-mono text-xs' : ''} ${
          accent ? 'text-base font-semibold text-slate-900' : 'text-slate-900'
        }`}
      >
        {valeur}
      </dd>
    </div>
  );
}

function CaseACocher({ label, coche }: { label: string; coche: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-700">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
          coche ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'
        }`}
      >
        {coche && '✓'}
      </span>
      {label}
    </span>
  );
}
