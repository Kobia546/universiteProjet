import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Check, X, Wallet } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import {
  fetchInscription,
  ajouterEcheance,
  modifierEcheance,
  supprimerEcheance,
  modifierDateInscription,
  type Echeance,
} from './api/enrollmentsApi';
import { formatDate, formatDateHeure, formatMontant } from '../../shared/lib/format';

const VARIANTE_STATUT_ECHEANCE: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  SOLDE: 'success',
  EN_RETARD: 'danger',
  PARTIEL: 'warning',
  A_PAYER: 'default',
};

export function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [echeanceEnEdition, setEcheanceEnEdition] = useState<string | null>(null);
  const [montantEdition, setMontantEdition] = useState('');
  const [dateEdition, setDateEdition] = useState('');
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [nouveauMontant, setNouveauMontant] = useState('');
  const [nouvelleDate, setNouvelleDate] = useState('');
  const [editionDateInscription, setEditionDateInscription] = useState(false);
  const [dateInscriptionEdition, setDateInscriptionEdition] = useState('');

  const { data: inscription, isLoading } = useQuery({
    queryKey: ['inscription', id],
    queryFn: () => fetchInscription(id!),
    enabled: !!id,
  });

  function invalider() {
    queryClient.invalidateQueries({ queryKey: ['inscription', id] });
  }

  const ajouterMutation = useMutation({
    mutationFn: (input: { montantPrevu: number; dateLimite: string }) =>
      ajouterEcheance(id!, input),
    onSuccess: () => {
      invalider();
      setAjoutEnCours(false);
      setNouveauMontant('');
      setNouvelleDate('');
    },
  });

  const modifierMutation = useMutation({
    mutationFn: (params: { echeanceId: string; montantPrevu?: number; dateLimite?: string }) =>
      modifierEcheance(id!, params.echeanceId, params),
    onSuccess: () => {
      invalider();
      setEcheanceEnEdition(null);
    },
  });

  const supprimerMutation = useMutation({
    mutationFn: (echeanceId: string) => supprimerEcheance(id!, echeanceId),
    onSuccess: invalider,
  });

  const modifierDateMutation = useMutation({
    mutationFn: (dateInscription: string) => modifierDateInscription(id!, dateInscription),
    onSuccess: () => {
      invalider();
      setEditionDateInscription(false);
    },
  });

  function commencerEdition(echeance: Echeance) {
    setEcheanceEnEdition(echeance.id);
    setMontantEdition(String(echeance.montantPrevu));
    setDateEdition(echeance.dateLimite.slice(0, 10));
  }

  if (isLoading) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!inscription) return <p className="text-sm text-slate-500">Inscription introuvable.</p>;

  const totalPaye =
    inscription.paiements?.filter((p) => p.statut === 'VALIDE').reduce((s, p) => s + Number(p.montant), 0) ?? 0;
  const resteAPayer = Math.max(Number(inscription.montantTotalDu) - totalPaye, 0);

  return (
    <div>
      <PageHeader
        title={`Inscription ${inscription.numeroInscription}`}
        description={`${inscription.etudiant.prenom} ${inscription.etudiant.nom} — ${inscription.filiere.libelle} · ${inscription.anneeUniversitaire.libelle}`}
        action={
          resteAPayer > 0 && inscription.statut !== 'ANNULEE' ? (
            <Button onClick={() => navigate(`/paiements/nouveau?inscriptionId=${inscription.id}`)}>
              <Wallet className="h-4 w-4" />
              Enregistrer un paiement
            </Button>
          ) : inscription.statut !== 'ANNULEE' ? (
            <Badge variant="success">Soldé</Badge>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <Card>
          <p className="text-sm text-slate-500">Scolarité</p>
          <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-slate-900">
            {formatMontant(inscription.montantTotalDu)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Montant payé</p>
          <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-slate-900">
            {formatMontant(totalPaye)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Solde</p>
         <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-slate-900">
            {formatMontant(resteAPayer)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Inscrit le (carnet)</p>
          {editionDateInscription ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                value={dateInscriptionEdition}
                onChange={(e) => setDateInscriptionEdition(e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
              <button
                onClick={() => modifierDateMutation.mutate(dateInscriptionEdition)}
                className="text-emerald-600"
                title="Enregistrer"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditionDateInscription(false)}
                className="text-slate-400"
                title="Annuler"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <p className="tabular-nums font-serif text-xl font-semibold text-slate-900">
                {formatDate(inscription.dateInscription)}
              </p>
              <button
                onClick={() => {
                  setDateInscriptionEdition(inscription.dateInscription.slice(0, 10));
                  setEditionDateInscription(true);
                }}
                className="text-slate-400 hover:text-brand-600"
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
       
        </Card>
        {/* {inscription.createdAt && (
          <Card>
            <p className="text-sm text-slate-500">Saisi le</p>
            <p className="tabular-nums mt-1 font-serif text-xl font-semibold text-slate-900">
              {formatDateHeure(inscription.createdAt)}
            </p>
        
          </Card>
        )} */}

        <Card className="col-span-1 sm:col-span-2 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-[15px] font-semibold text-slate-900">Échéancier</h2>
            {!ajoutEnCours && (
              <button
                onClick={() => setAjoutEnCours(true)}
                className="flex items-center gap-1 text-xs font-medium text-brand-700 underline"
              >
                <Plus className="h-3 w-3" />
                Ajouter une échéance
              </button>
            )}
          </div>

          <p className="mb-3 text-xs text-slate-500">
            Montant et date de chaque échéance modifiables librement — le montant total dû et le
            reste à payer se recalculent automatiquement.
          </p>

          {ajoutEnCours && (
            <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg bg-brand-50/50 p-3">
              <div className="w-40">
                <Input
                  label="Montant"
                  type="number"
                  min="0"
                  value={nouveauMontant}
                  onChange={(e) => setNouveauMontant(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Input
                  label="Date limite"
                  type="date"
                  value={nouvelleDate}
                  onChange={(e) => setNouvelleDate(e.target.value)}
                />
              </div>
              <Button
                disabled={!nouveauMontant || !nouvelleDate}
                isLoading={ajouterMutation.isPending}
                onClick={() =>
                  ajouterMutation.mutate({
                    montantPrevu: Number(nouveauMontant),
                    dateLimite: nouvelleDate,
                  })
                }
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => setAjoutEnCours(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!inscription.echeances || inscription.echeances.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune échéance.</p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">N°</th>
                  <th className="py-2">Échéance limite</th>
                  <th className="py-2 text-right">Montant prévu</th>
                  <th className="py-2">Statut</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inscription.echeances.map((echeance) => {
                  const enEdition = echeanceEnEdition === echeance.id;
                  return (
                    <tr key={echeance.id} className={enEdition ? 'bg-brand-50/40' : ''}>
                      <td className="py-2">{echeance.numeroEcheance}</td>
                      <td className="py-2">
                        {enEdition ? (
                          <input
                            type="date"
                            value={dateEdition}
                            onChange={(e) => setDateEdition(e.target.value)}
                            className="rounded border border-slate-200 px-2 py-1 text-sm"
                          />
                        ) : (
                          formatDate(echeance.dateLimite)
                        )}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {enEdition ? (
                          <input
                            type="number"
                            min="0"
                            value={montantEdition}
                            onChange={(e) => setMontantEdition(e.target.value)}
                            className="w-28 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          formatMontant(echeance.montantPrevu)
                        )}
                      </td>
                      <td className="py-2">
                        <Badge variant={VARIANTE_STATUT_ECHEANCE[echeance.statut] || 'default'}>
                          {echeance.statut}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          {enEdition ? (
                            <>
                              <button
                                onClick={() =>
                                  modifierMutation.mutate({
                                    echeanceId: echeance.id,
                                    montantPrevu: Number(montantEdition),
                                    dateLimite: dateEdition,
                                  })
                                }
                                className="text-emerald-600"
                                title="Enregistrer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEcheanceEnEdition(null)}
                                className="text-slate-400"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => commencerEdition(echeance)}
                                className="text-slate-400 hover:text-brand-600"
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Supprimer cette échéance ?')) {
                                    supprimerMutation.mutate(echeance.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </Card>
      </div>
    </div>
  );
}
