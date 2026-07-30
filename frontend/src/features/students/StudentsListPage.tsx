import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Search, FileDown, Upload } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { fetchEtudiants, createEtudiant, fetchEtudiantsParStatutPaiement } from './api/studentsApi';
import { fetchAnneesUniversitaires } from '../programs/programsApi';
import { formatDate, formatMontant, formatMontantPdf } from '../../shared/lib/format';
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

type Onglet = 'tous' | 'doit' | 'solde';

export function StudentsListPage() {
  const [onglet, setOnglet] = useState<Onglet>('tous');
  const [anneeFiltre, setAnneeFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState<string | null>(null);
  const fichierInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: etudiants, isLoading } = useQuery({
    queryKey: ['etudiants', recherche],
    queryFn: () => fetchEtudiants(recherche || undefined),
    enabled: onglet === 'tous',
  });

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  const { data: etudiantsStatut, isLoading: isLoadingStatut } = useQuery({
    queryKey: ['etudiants-statut-paiement', onglet, anneeFiltre],
    queryFn: () =>
      fetchEtudiantsParStatutPaiement(onglet as 'doit' | 'solde', anneeFiltre || undefined),
    enabled: onglet === 'doit' || onglet === 'solde',
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
    if (onglet === 'tous') {
      if (!etudiants || etudiants.length === 0) return;
      exporterPdf({
        titre: 'Liste des étudiants',
        sousTitre: `${etudiants.length} étudiant(s) — export du ${formatDate(new Date().toISOString())}`,
        colonnes: ['Matricule', 'Nom', 'Prénom', 'Type', 'Téléphone', 'Statut paiement', 'Inscrit le'],
        lignes: etudiants.map((e) => [
          e.matricule,
          e.nom,
          e.prenom,
          e.type === 'TRAVAILLEUR' ? 'Travailleur' : 'Étudiant',
          e.telephone || '—',
          e.statutPaiement === 'SOLDE'
            ? 'Soldé'
            : e.statutPaiement === 'DOIT'
              ? `Doit ${formatMontantPdf(e.resteAPayer ?? 0)}`
              : 'Aucune inscription',
          formatDate(e.createdAt),
        ]),
        nomFichier: 'etudiants',
      });
    } else {
      if (!etudiantsStatut || etudiantsStatut.length === 0) return;
      exporterPdf({
        titre: onglet === 'doit' ? 'Étudiants ayant un solde restant' : 'Étudiants ayant soldé',
        sousTitre: `${etudiantsStatut.length} étudiant(s) — export du ${formatDate(new Date().toISOString())}`,
        colonnes: ['Matricule', 'Nom', 'Prénom', 'Total dû', 'Total payé', 'Reste à payer'],
        lignes: etudiantsStatut.map((e) => [
          e.matricule,
          e.nom,
          e.prenom,
          formatMontantPdf(e.totalDu),
          formatMontantPdf(e.totalPaye),
          formatMontantPdf(e.resteAPayer),
        ]),
        nomFichier: onglet === 'doit' ? 'etudiants-doivent' : 'etudiants-soldes',
      });
    }
  }

  return (
    <div>
      <PageHeader
        title="Universitaires"
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
            <Button variant="secondary" onClick={exporter}>
              <FileDown className="h-4 w-4" />
              Exporter PDF
            </Button>
            <Button onClick={() => navigate('/etudiants/nouveau')}>
              <Plus className="h-4 w-4" />
              Nouvel universitaire
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

      <div className="mb-4 flex max-w-full gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 w-fit">
        {(
          [
            { key: 'tous', label: 'Tous' },
            { key: 'doit', label: 'Qui doivent' },
            { key: 'solde', label: 'Soldés' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setOnglet(tab.key)}
            className={`rounded-md whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
              onglet === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(onglet === 'doit' || onglet === 'solde') && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-slate-500">Année :</label>
          <select
            value={anneeFiltre}
            onChange={(e) => setAnneeFiltre(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Année active</option>
            {annees?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle} {a.active ? '(active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {onglet === 'tous' && (
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
      )}

      {onglet === 'tous' ? (
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
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Téléphone</th>
                  <th className="px-5 py-3">Statut paiement</th>
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
                    <td className="px-5 py-3">
                      <Badge variant={etudiant.type === 'TRAVAILLEUR' ? 'info' : 'default'}>
                        {etudiant.type === 'TRAVAILLEUR' ? 'Travailleur' : 'Étudiant'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{etudiant.telephone || '—'}</td>
                    <td className="px-5 py-3">
                      {etudiant.statutPaiement === 'SOLDE' ? (
                        <Badge variant="success">Soldé</Badge>
                      ) : etudiant.statutPaiement === 'DOIT' ? (
                        <Badge variant="danger">
                          Doit {formatMontant(etudiant.resteAPayer ?? 0)}
                        </Badge>
                      ) : (
                        <Badge variant="default">Aucune inscription</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(etudiant.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {isLoadingStatut ? (
            <p className="p-6 text-sm text-slate-500">Chargement...</p>
          ) : !etudiantsStatut || etudiantsStatut.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              {onglet === 'doit' ? "Aucun étudiant ne doit d'argent." : "Aucun étudiant n'a encore soldé."}
            </p>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Matricule</th>
                  <th className="px-5 py-3">Nom</th>
                  <th className="px-5 py-3">Filière(s)</th>
                  <th className="px-5 py-3 text-right">Total dû</th>
                  <th className="px-5 py-3 text-right">Total payé</th>
                  <th className="px-5 py-3 text-right">Reste à payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {etudiantsStatut.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/etudiants/${e.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{e.matricule}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {e.prenom} {e.nom}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {e.inscriptions.map((i) => i.filiere).join(', ')}
                    </td>
                    <td className="px-5 py-3 text-right">{formatMontant(e.totalDu)}</td>
                    <td className="px-5 py-3 text-right">{formatMontant(e.totalPaye)}</td>
                    <td
                      className={`px-5 py-3 text-right font-medium ${
                        e.resteAPayer > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMontant(e.resteAPayer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}
    </div>
  );
}
