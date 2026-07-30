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
  return (
    <div>
      <PageHeader
        title="Éditions"
        description="Générer des documents PDF prêts à imprimer ou archiver"
      />
      <div className="space-y-6">
        <EditionUniversitairesFiliere />
        <EditionNonSoldes />
        <EditionOperationsComptables />
        <EditionCompteDeResultat />
      </div>
    </div>
  );
}

function EditionUniversitairesFiliere() {
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const [filiereId, setFiliereId] = useState('');

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });

  async function exporter() {
    const inscriptions = await fetchInscriptions({
      anneeUniversitaireId: anneeUniversitaireId || undefined,
      filiereId: filiereId || undefined,
    });
    const filiere = filieres?.find((f) => f.id === filiereId);
    const annee = annees?.find((a) => a.id === anneeUniversitaireId);
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

  return (
    <Card>
      <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
        Liste des universitaires d'une filière, d'une période
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Laisse les champs vides pour inclure toutes les filières / toutes les années.
      </p>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
      <Button variant="secondary" onClick={exporter}>
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </Card>
  );
}

function EditionNonSoldes() {
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });

  async function exporter() {
    const etudiants = await fetchEtudiantsParStatutPaiement('doit', anneeUniversitaireId || undefined);
    const annee = annees?.find((a) => a.id === anneeUniversitaireId);
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

  return (
    <Card>
      <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
        Liste des universitaires n'ayant pas encore soldé
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Laisse le champ vide pour utiliser l'année universitaire active.
      </p>
      <div className="mb-4 max-w-xs">
        <select
          value={anneeUniversitaireId}
          onChange={(e) => setAnneeUniversitaireId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Année active</option>
          {annees?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.libelle}
            </option>
          ))}
        </select>
      </div>
      <Button variant="secondary" onClick={exporter}>
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </Card>
  );
}

function EditionOperationsComptables() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  async function exporter() {
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

  return (
    <Card>
      <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
        Liste des opérations comptables d'une période
      </h2>
      <p className="mb-4 text-xs text-slate-500">Recettes (EP703) et dépenses (EP704) mêlées, triées par date.</p>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <Button variant="secondary" onClick={exporter}>
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </Card>
  );
}

function EditionCompteDeResultat() {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  async function exporter() {
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
    <Card>
      <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">
        Compte de résultat des opérations comptables
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Synthèse recettes / dépenses / résultat net sur la période choisie.
      </p>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <Button variant="secondary" onClick={exporter}>
        <FileDown className="h-4 w-4" />
        Exporter en PDF
      </Button>
    </Card>
  );
}
