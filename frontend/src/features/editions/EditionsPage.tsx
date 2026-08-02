import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { fetchInscriptions } from '../enrollments/api/enrollmentsApi';
import { fetchFilieres, fetchAnneesUniversitaires } from '../programs/programsApi';
import { fetchEtudiantsParStatutPaiement } from '../students/api/studentsApi';
import { fetchEp703, fetchEp704, fetchEp706 } from '../accounting/api/accountingApi';
import { formatDate, formatMontantPdf } from '../../shared/lib/format';
import { exporterPdf } from '../../shared/lib/exporterPdf';

export function EditionsPage() {
  // Filtres centralisés — utilisés par les quatre exports ci-dessous,
  // chacun n'utilisant que ceux qui le concernent (pas de champs dupliqués).
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const [filiereId, setFiliereId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });

  const annee = annees?.find((a) => a.id === anneeUniversitaireId);
  const filiere = filieres?.find((f) => f.id === filiereId);

  async function exporterUniversitaires() {
    const inscriptions = await fetchInscriptions({
      anneeUniversitaireId: anneeUniversitaireId || undefined,
      filiereId: filiereId || undefined,
    });
    exporterPdf({
      titre: 'Liste des universitaires par filière et période',
      sousTitre: `${filiere?.libelle ?? 'Toutes filières'} — ${annee?.libelle ?? 'Toutes années'} — ${inscriptions.length} universitaire(s)`,
      colonnes: ['Matricule', 'Nom', 'Prénom', 'Filière', 'Année', 'Montant dû'],
      lignes: inscriptions.map((i) => [
        i.etudiant.matricule,
        i.etudiant.nom,
        i.etudiant.prenom,
        i.filiere.libelle,
        i.anneeUniversitaire.libelle,
        formatMontantPdf(i.montantTotalDu),
      ]),
      nomFichier: 'universitaires-filiere-periode',
    });
  }

  async function exporterNonSoldes() {
    const etudiants = await fetchEtudiantsParStatutPaiement('doit', anneeUniversitaireId || undefined);
    exporterPdf({
      titre: "Liste des universitaires n'ayant pas encore soldé",
      sousTitre: `${annee?.libelle ?? 'Année active'} — ${etudiants.length} universitaire(s)`,
      colonnes: ['Matricule', 'Nom', 'Prénom', 'Total dû', 'Total payé', 'Reste à payer'],
      lignes: etudiants.map((e) => [
        e.matricule,
        e.nom,
        e.prenom,
        formatMontantPdf(e.totalDu),
        formatMontantPdf(e.totalPaye),
        formatMontantPdf(e.resteAPayer),
      ]),
      nomFichier: 'universitaires-non-soldes',
    });
  }

  async function exporterOperationsComptables() {
    const [recettes, depenses] = await Promise.all([
      fetchEp703({ dateDebut: dateDebut || undefined, dateFin: dateFin || undefined }),
      fetchEp704({ dateDebut: dateDebut || undefined, dateFin: dateFin || undefined }),
    ]);

    type Ligne = { date: string; numero: string; libelle: string; type: string; montant: number };
    const operations: Ligne[] = [
      ...recettes.map((r) => ({
        date: r.date,
        numero: r.numeroBordereau,
        libelle: r.libelle,
        type: 'Recette',
        montant: Number(r.montant),
      })),
      ...depenses.map((d) => ({
        date: d.date,
        numero: d.numeroCheque,
        libelle: d.libelle,
        type: 'Dépense',
        montant: Number(d.montant),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    exporterPdf({
      titre: 'Liste des opérations comptables',
      sousTitre: `Période du ${dateDebut ? formatDate(dateDebut) : 'début'} au ${dateFin ? formatDate(dateFin) : "aujourd'hui"} — ${operations.length} opération(s)`,
      colonnes: ['Date', 'N°', 'Type', 'Libellé', 'Montant'],
      lignes: operations.map((o) => [
        formatDate(o.date),
        o.numero,
        o.type,
        o.libelle,
        formatMontantPdf(o.montant),
      ]),
      nomFichier: 'operations-comptables-periode',
    });
  }

  async function exporterCompteDeResultat() {
    const centralisateur = await fetchEp706({
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    });
    exporterPdf({
      titre: 'Compte de résultat',
      sousTitre: `Période du ${dateDebut ? formatDate(dateDebut) : 'début'} au ${dateFin ? formatDate(dateFin) : "aujourd'hui"}`,
      colonnes: ['Indicateur', 'Valeur'],
      lignes: [
        ['Total des recettes (EP703)', formatMontantPdf(centralisateur.totalRecettes)],
        ['Total des dépenses (EP704)', formatMontantPdf(centralisateur.totalDepenses)],
        ['Résultat (recettes - dépenses)', formatMontantPdf(centralisateur.solde)],
        ["Nombre d'opérations", String(centralisateur.nombreOperations)],
      ],
      nomFichier: 'compte-de-resultat',
    });
  }

  return (
    <div>
      <PageHeader
        title="Éditions"
        description="Générer des documents PDF prêts à imprimer ou archiver"
      />

      {/* ---- Filtres centralisés, communs à tous les exports ---- */}
      <Card className="mb-6">
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">Filtres</h2>
        <p className="mb-4 text-xs text-slate-500">
          Chaque export ci-dessous n'utilise que les filtres qui le concernent (laisse-les vides
          pour "toutes années" / "toutes filières" / "depuis le début").
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Année universitaire</label>
            <select
              value={anneeUniversitaireId}
              onChange={(e) => setAnneeUniversitaireId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les années</option>
              {annees?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Filière</label>
            <select
              value={filiereId}
              onChange={(e) => setFiliereId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Toutes les filières</option>
              {filieres?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.libelle}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Période — du</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Période — au</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>

      {/* ---- Liste des documents disponibles ---- */}
      <Card className="overflow-hidden p-0">
        <LigneEdition
          titre="Liste des universitaires d'une filière, d'une période"
          description="Utilise les filtres Année et Filière ci-dessus."
          onExporter={exporterUniversitaires}
        />
        <LigneEdition
          titre="Liste des universitaires n'ayant pas encore soldé"
          description="Utilise le filtre Année ci-dessus (année active si vide)."
          onExporter={exporterNonSoldes}
        />
        <LigneEdition
          titre="Liste des opérations comptables d'une période"
          description="Recettes (EP703) et dépenses (EP704) mêlées, triées par date — utilise la Période ci-dessus."
          onExporter={exporterOperationsComptables}
        />
        <LigneEdition
          titre="Compte de résultat"
          description="Synthèse recettes / dépenses / résultat net — utilise la Période ci-dessus."
          onExporter={exporterCompteDeResultat}
          dernier
        />
      </Card>
    </div>
  );
}

function LigneEdition({
  titre,
  description,
  onExporter,
  dernier,
}: {
  titre: string;
  description: string;
  onExporter: () => void;
  dernier?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center ${
        dernier ? '' : 'border-b border-slate-100'
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{titre}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Button variant="secondary" onClick={onExporter} className="shrink-0">
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </div>
  );
}
