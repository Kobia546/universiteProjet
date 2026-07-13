import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Search, FileDown, Upload } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { fetchEtudiants, createEtudiant } from './api/studentsApi';
import { formatDate } from '../../shared/lib/format';
import { exporterPdf } from '../../shared/lib/exporterPdf';
import type { CreateEtudiantInput, Sexe } from './types';

interface LigneCsv {
  nom?: string;
  prenom?: string;
  sexe?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
}

export function StudentsListPage() {
  const [recherche, setRecherche] = useState('');
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState<string | null>(null);
  const fichierInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: etudiants, isLoading } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants(recherche || undefined),
  });

  const importerMutation = useMutation({
    mutationFn: async (lignes: LigneCsv[]) => {
      let reussis = 0;
      let echecs = 0;
      for (const ligne of lignes) {
        if (!ligne.nom || !ligne.prenom || !ligne.dateNaissance) {
          echecs++;
          continue;
        }
        const sexe: Sexe = ligne.sexe?.toUpperCase().startsWith('F') ? 'F' : 'M';
        const input: CreateEtudiantInput = {
          nom: ligne.nom,
          prenom: ligne.prenom,
          sexe,
          dateNaissance: ligne.dateNaissance,
          lieuNaissance: ligne.lieuNaissance,
          telephone: ligne.telephone,
          email: ligne.email,
          adresse: ligne.adresse,
        };
        try {
          await createEtudiant(input);
          reussis++;
        } catch {
          echecs++;
        }
      }
      return { reussis, echecs };
    },
    onSuccess: ({ reussis, echecs }) => {
      queryClient.invalidateQueries({ queryKey: ['etudiants'] });
      setResultatImport(
        `${reussis} étudiant(s) importé(s)` + (echecs > 0 ? `, ${echecs} ligne(s) ignorée(s) (champs manquants)` : '.'),
      );
      setImportEnCours(false);
    },
    onError: () => setImportEnCours(false),
  });

  function handleFichierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setResultatImport(null);
    setImportEnCours(true);
    Papa.parse<LigneCsv>(fichier, {
      header: true,
      skipEmptyLines: true,
      complete: (resultats) => importerMutation.mutate(resultats.data),
      error: () => setImportEnCours(false),
    });
    e.target.value = '';
  }

  function exporter() {
    if (!etudiants || etudiants.length === 0) return;
    exporterPdf({
      titre: 'Liste des étudiants',
      sousTitre: `${etudiants.length} étudiant(s) — export du ${formatDate(new Date().toISOString())}`,
      colonnes: ['Matricule', 'Nom', 'Prénom', 'Téléphone', 'Inscrit le'],
      lignes: etudiants.map((e) => [
        e.matricule,
        e.nom,
        e.prenom,
        e.telephone || '—',
        formatDate(e.createdAt),
      ]),
      nomFichier: 'etudiants',
    });
  }

  return (
    <div>
      <PageHeader
        title="Étudiants"
        description="Gérez les fiches et le parcours de chaque étudiant"
        action={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fichierInputRef}
              type="file"
              accept=".csv"
              onChange={handleFichierChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              isLoading={importEnCours}
              onClick={() => fichierInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Importer CSV
            </Button>
            <Button variant="secondary" onClick={exporter} disabled={!etudiants?.length}>
              <FileDown className="h-4 w-4" />
              Exporter PDF
            </Button>
            <Button onClick={() => navigate('/etudiants/nouveau')}>
              <Plus className="h-4 w-4" />
              Nouvel étudiant
            </Button>
          </div>
        }
      />

      {resultatImport && (
        <div className="mb-4 rounded-lg bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
          {resultatImport}
        </div>
      )}

      <details className="mb-4 text-xs text-slate-500">
        <summary className="cursor-pointer select-none text-brand-700">
          Format attendu pour l'import CSV
        </summary>
        <p className="mt-1">
          Colonnes (en-tête requis) : <code className="font-mono">nom, prenom, sexe, dateNaissance, lieuNaissance, telephone, email, adresse</code>
          {' '}— sexe : <code className="font-mono">M</code> ou <code className="font-mono">F</code>, dateNaissance au format{' '}
          <code className="font-mono">AAAA-MM-JJ</code>. Le matricule est généré automatiquement.
        </p>
      </details>

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par nom, prénom ou matricule..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Chargement...</p>
        ) : !etudiants || etudiants.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun étudiant trouvé.</p>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Matricule</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Prénom</th>
                <th className="px-5 py-3">Téléphone</th>
                <th className="px-5 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {etudiants.map((etudiant) => (
                <tr
                  key={etudiant.id}
                  onClick={() => navigate(`/etudiants/${etudiant.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{etudiant.matricule}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{etudiant.nom}</td>
                  <td className="px-5 py-3 text-slate-700">{etudiant.prenom}</td>
                  <td className="px-5 py-3 text-slate-500">{etudiant.telephone || '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(etudiant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
