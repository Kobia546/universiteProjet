import { useQuery } from '@tanstack/react-query';
import { fetchFilieres, fetchNiveaux } from '../../../features/programs/programsApi';
import { Select } from './Select';

interface Props {
  niveauId: string;
  filiereId: string;
  onNiveauChange: (id: string) => void;
  onFiliereChange: (id: string) => void;
}

/** Filtres « Niveau » + « Filière », réutilisés dans toutes les listes. */
export function FiltresProgramme({ niveauId, filiereId, onNiveauChange, onFiliereChange }: Props) {
  const { data: niveaux } = useQuery({ queryKey: ['niveaux'], queryFn: fetchNiveaux });
  const { data: filieres } = useQuery({
    queryKey: ['filieres'],
    queryFn: () => fetchFilieres(),
  });
  return (
    <>
      <Select
        label="Niveau"
        value={niveauId}
        onChange={(e) => onNiveauChange(e.target.value)}
      >
        <option value="">Tous les niveaux</option>
        {niveaux?.map((n) => (
          <option key={n.id} value={n.id}>
            {n.libelle}
          </option>
        ))}
      </Select>
      <Select
        label="Filière"
        value={filiereId}
        onChange={(e) => onFiliereChange(e.target.value)}
      >
        <option value="">Toutes les filières</option>
        {filieres?.map((f) => (
          <option key={f.id} value={f.id}>
            {f.libelle}
            {f.actif ? '' : ' (désactivée)'}
          </option>
        ))}
      </Select>
    </>
  );
}
