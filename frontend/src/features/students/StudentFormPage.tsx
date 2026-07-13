import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { createEtudiant } from './api/studentsApi';
import type { CreateEtudiantInput, Sexe } from './types';

const CHAMPS_INITIAUX: CreateEtudiantInput = {
  nom: '',
  prenom: '',
  sexe: 'M',
  dateNaissance: '',
  lieuNaissance: '',
  telephone: '',
  email: '',
  adresse: '',
  informationsComplementaires: '',
};

export function StudentFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateEtudiantInput>(CHAMPS_INITIAUX);

  const mutation = useMutation({
    mutationFn: createEtudiant,
    onSuccess: (etudiant) => {
      queryClient.invalidateQueries({ queryKey: ['etudiants'] });
      navigate(`/etudiants/${etudiant.id}`);
    },
  });

  function handleChange(champ: keyof CreateEtudiantInput, valeur: string) {
    setForm((prev) => ({ ...prev, [champ]: valeur }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Nouvel étudiant" description="Créer la fiche complète d'un étudiant" />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nom"
              value={form.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              required
            />
            <Input
              label="Prénom"
              value={form.prenom}
              onChange={(e) => handleChange('prenom', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Input
              label="Date de naissance"
              type="date"
              value={form.dateNaissance}
              onChange={(e) => handleChange('dateNaissance', e.target.value)}
              required
            />
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
              Une erreur est survenue lors de la création. Vérifiez les champs et réessayez.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/etudiants')}>
              Annuler
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              Créer l'étudiant
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
