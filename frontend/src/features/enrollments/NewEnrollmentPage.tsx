import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { fetchEtudiants, fetchEtudiant } from '../students/api/studentsApi';
import { fetchAnneesUniversitaires } from '../programs/programsApi';
import { createInscription } from './api/enrollmentsApi';
import { ChoixNiveauFiliere } from '../../shared/components/ui/ChoixNiveauFiliere';
import { messageErreur } from '../../shared/lib/erreurs';

export function NewEnrollmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const etudiantPreselectionne = searchParams.get('etudiantId') ?? '';

  const [recherche, setRecherche] = useState('');
  const [etudiantId, setEtudiantId] = useState(etudiantPreselectionne);
  const [niveauId, setNiveauId] = useState('');
  const [filiereId, setFiliereId] = useState('');
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');

  const { data: etudiants } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants({ recherche: recherche || undefined }),
    enabled: !etudiantPreselectionne,
  });
  const { data: etudiantPreselectionneDetail } = useQuery({
    queryKey: ['etudiant', etudiantPreselectionne],
    queryFn: () => fetchEtudiant(etudiantPreselectionne),
    enabled: !!etudiantPreselectionne,
  });
  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  // Pré-sélectionne l'année active dès qu'elle est chargée
  useEffect(() => {
    if (!anneeUniversitaireId && annees?.length) {
      const active = annees.find((a) => a.active) ?? annees[0];
      setAnneeUniversitaireId(active.id);
    }
  }, [annees, anneeUniversitaireId]);

  const etudiantSelectionne = etudiantPreselectionneDetail ?? etudiants?.find((e) => e.id === etudiantId);

  const mutation = useMutation({
    mutationFn: createInscription,
    onSuccess: (inscription) => {
      queryClient.invalidateQueries({ queryKey: ['inscriptions'] });
      navigate(`/inscriptions/${inscription.id}`);
    },
  });

  const peutValider = etudiantId && niveauId && filiereId && anneeUniversitaireId;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nouvelle inscription"
        description="Rattacher un étudiant existant à un niveau, une filière et une année universitaire"
      />

      <Card className="space-y-6">
        {/* Étudiant */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Étudiant</label>
          {!etudiantPreselectionne && (
            <Input
              placeholder="Rechercher par nom, prénom, matricule, numéro ou date de naissance (jj/mm/aaaa)..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          )}
          {!etudiantPreselectionne && recherche && etudiants && etudiants.length > 0 && !etudiantSelectionne && (
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
        </div>

        {/* Année universitaire */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Année universitaire
          </label>
          <select
            value={anneeUniversitaireId}
            onChange={(e) => {
              setAnneeUniversitaireId(e.target.value);
              setNiveauId('');
              setFiliereId('');
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Sélectionner...</option>
            {annees?.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.libelle} {annee.active ? '(active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Niveau d'abord, puis filière (spécialité) */}
        <ChoixNiveauFiliere
          anneeUniversitaireId={anneeUniversitaireId}
          niveauId={niveauId}
          filiereId={filiereId}
          onNiveauChange={setNiveauId}
          onFiliereChange={setFiliereId}
        />

        {mutation.isError && (
          <p className="text-sm text-red-600">
            {messageErreur(
              mutation.error,
              "Une erreur est survenue. Vérifiez qu'une règle de paiement est configurée pour ce niveau/type/année.",
            )}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/inscriptions')}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!peutValider}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate({ etudiantId, niveauId, filiereId, anneeUniversitaireId })}
          >
            Créer l'inscription
          </Button>
        </div>
      </Card>
    </div>
  );
}
