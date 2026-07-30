import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { fetchEtudiant, updateEtudiant } from './api/studentsApi';
import type { CreateEtudiantInput, Sexe, TypeEtudiant } from './types';

export function StudentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: etudiant, isLoading } = useQuery({
    queryKey: ['etudiant', id],
    queryFn: () => fetchEtudiant(id!),
    enabled: !!id,
  });

  const [form, setForm] = useState<CreateEtudiantInput | null>(null);

  // Pré-remplit le formulaire dès que la fiche est chargée.
  useEffect(() => {
    if (etudiant && !form) {
      setForm({
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        sexe: etudiant.sexe,
        type: etudiant.type,
        dateNaissance: etudiant.dateNaissance.slice(0, 10),
        lieuNaissance: etudiant.lieuNaissance ?? '',
        telephone: etudiant.telephone ?? '',
        email: etudiant.email ?? '',
        adresse: etudiant.adresse ?? '',
        informationsComplementaires: etudiant.informationsComplementaires ?? '',
      });
    }
  }, [etudiant, form]);

  const mutation = useMutation({
    mutationFn: (input: CreateEtudiantInput) => updateEtudiant(id!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etudiant', id] });
      queryClient.invalidateQueries({ queryKey: ['etudiants'] });
      navigate(`/etudiants/${id}`);
    },
  });

  function handleChange(champ: keyof CreateEtudiantInput, valeur: string) {
    setForm((prev) => (prev ? { ...prev, [champ]: valeur } : prev));
  }

  if (isLoading || !form) return <p className="text-sm text-slate-500">Chargement...</p>;
  if (!etudiant) return <p className="text-sm text-slate-500">Étudiant introuvable.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Modifier la fiche"
        description={`${etudiant.prenom} ${etudiant.nom} — ${etudiant.matricule}`}
      />

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nom" value={form.nom} onChange={(e) => handleChange('nom', e.target.value)} required />
            <Input
              label="Prénom"
              value={form.prenom}
              onChange={(e) => handleChange('prenom', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Sexe</label>
              <select
                value={form.sexe}
                onChange={(e) => handleChange('sexe', e.target.value as Sexe)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as TypeEtudiant)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ETUDIANT">Étudiant</option>
                <option value="TRAVAILLEUR">Travailleur</option>
              </select>
            </div>
          </div>

          <Input
            label="Lieu de naissance"
            value={form.lieuNaissance}
            onChange={(e) => handleChange('lieuNaissance', e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Téléphone"
              value={form.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <Input
            label="Adresse"
            value={form.adresse}
            onChange={(e) => handleChange('adresse', e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Informations complémentaires</label>
            <textarea
              value={form.informationsComplementaires}
              onChange={(e) => handleChange('informationsComplementaires', e.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600">
              Une erreur est survenue lors de l'enregistrement. Vérifiez les champs et réessayez.
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate(`/etudiants/${id}`)}>
              Annuler
            </Button>
            <Button
              type="button"
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
