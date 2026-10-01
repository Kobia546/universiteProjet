import { useQuery } from '@tanstack/react-query';
import { fetchFilieres, fetchNiveaux } from '../../../features/programs/programsApi';
import { Select } from './Select';

interface Props {
  anneeUniversitaireId?: string;
  niveauId: string;
  filiereId: string;
  onNiveauChange: (id: string) => void;
  onFiliereChange: (id: string) => void;
  errorNiveau?: string;
  errorFiliere?: string;
}

/**
 * Choix à l'inscription : d'abord le niveau (Licence 1/2/3, Master 1/2 —
 * ouverts pour l'année choisie), puis la filière (spécialité).
 */
export function ChoixNiveauFiliere({
  anneeUniversitaireId,
  niveauId,
  filiereId,
  onNiveauChange,
  onFiliereChange,
  errorNiveau,
  errorFiliere,
}: Props) {
  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: filieres } = useQuery({
    queryKey: ['filieres', 'actifs'],
    queryFn: () => fetchFilieres(true),
  });

  const niveauxOuverts = (niveaux ?? []).filter(
    (n) =>
      !anneeUniversitaireId ||
      n.anneesOuvertes?.some((o) => o.anneeUniversitaireId === anneeUniversitaireId && o.actif),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Niveau"
        value={niveauId}
        error={errorNiveau}
        onChange={(e) => onNiveauChange(e.target.value)}
      >
        <option value="">Choisir le niveau…</option>
        {niveauxOuverts.map((n) => (
          <option key={n.id} value={n.id}>
            {n.libelle}
          </option>
        ))}
      </Select>
      <Select
        label="Filière"
        value={filiereId}
        error={errorFiliere}
        disabled={!niveauId}
        onChange={(e) => onFiliereChange(e.target.value)}
      >
        <option value="">{niveauId ? 'Choisir la filière…' : "D'abord le niveau"}</option>
        {filieres?.map((f) => (
          <option key={f.id} value={f.id}>
            {f.libelle}
          </option>
        ))}
      </Select>
    </div>
  );
}
