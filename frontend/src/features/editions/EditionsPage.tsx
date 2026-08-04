import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, ChevronDown, Eye } from 'lucide-react';
import { PageHeader } from '../../shared/components/layout/PageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { fetchInscriptions } from '../enrollments/api/enrollmentsApi';
import { fetchFilieres, fetchAnneesUniversitaires } from '../programs/programsApi';
import { fetchEtudiantsParStatutPaiement } from '../students/api/studentsApi';
import { fetchEp703, fetchEp704, fetchEp706 } from '../accounting/api/accountingApi';
import { formatDate, formatMontantPdf } from '../../shared/lib/format';
import { exporterPdf } from '../../shared/lib/exporterPdf';

interface DocumentEdition {
  titre: string;
  sousTitre?: string;
  colonnes: string[];
  lignes: (string | number)[][];
  pied?: string;
  nomFichier: string;
}

type IdDocument = 'universitaires' | 'non-soldes' | 'operations' | 'resultat';

export function EditionsPage() {
  // Filtres centralisés — utilisés par les quatre exports ci-dessous,
  // chacun n'utilisant que ceux qui le concernent (pas de champs dupliqués).
  const [anneeUniversitaireId, setAnneeUniversitaireId] = useState('');
  const [filiereId, setFiliereId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // Un seul document déplié/prévisualisé à la fois — sa donnée reste en
  // cache tant qu'on ne change pas les filtres, pour ne pas re-fetcher à
  // chaque ouverture/fermeture du panneau.
  const [documentOuvert, setDocumentOuvert] = useState<IdDocument | null>(null);
  const [donneesParDocument, setDonneesParDocument] = useState<Partial<Record<IdDocument, DocumentEdition>>>({});
  const [chargementId, setChargementId] = useState<IdDocument | null>(null);
  const [exportEnCoursId, setExportEnCoursId] = useState<IdDocument | null>(null);

  const { data: annees } = useQuery({
    queryKey: ['annees-universitaires'],
    queryFn: fetchAnneesUniversitaires,
  });
  const { data: filieres } = useQuery({ queryKey: ['filieres'], queryFn: fetchFilieres });

  const annee = annees?.find((a) => a.id === anneeUniversitaireId);
  const filiere = filieres?.find((f) => f.id === filiereId);

  async function preparerUniversitaires(): Promise<DocumentEdition> {
    const inscriptions = await fetchInscriptions({
      anneeUniversitaireId: anneeUniversitaireId || undefined,
      filiereId: filiereId || undefined,
    });
    return {
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
    };
  }

  async function preparerNonSoldes(): Promise<DocumentEdition> {
    const etudiants = await fetchEtudiantsParStatutPaiement('doit', anneeUniversitaireId || undefined);
    return {
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
    };
  }

  async function preparerOperationsComptables(): Promise<DocumentEdition> {
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
        numero: d.numeroOperation,
        libelle: d.libelle,
        type: 'Dépense',
        montant: Number(d.montant),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
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
    };
  }

  async function preparerCompteDeResultat(): Promise<DocumentEdition> {
    const centralisateur = await fetchEp706({
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
    });
    return {
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
    };
  }

  const preparateurs: Record<IdDocument, () => Promise<DocumentEdition>> = {
    universitaires: preparerUniversitaires,
    'non-soldes': preparerNonSoldes,
    operations: preparerOperationsComptables,
    resultat: preparerCompteDeResultat,
  };

  // Les filtres ont changé depuis le dernier aperçu ? On vide le cache pour
  // forcer un rechargement au prochain clic, plutôt que de montrer un
  // aperçu périmé par rapport aux filtres actuellement affichés.
  function reinitialiserApercu(id: IdDocument) {
    setDonneesParDocument((precedent) => {
      const copie = { ...precedent };
      delete copie[id];
      return copie;
    });
  }

  async function basculerApercu(id: IdDocument) {
    if (documentOuvert === id) {
      setDocumentOuvert(null);
      return;
    }
    setDocumentOuvert(id);
    if (!donneesParDocument[id]) {
      setChargementId(id);
      try {
        const doc = await preparateurs[id]();
        setDonneesParDocument((precedent) => ({ ...precedent, [id]: doc }));
      } finally {
        setChargementId(null);
      }
    }
  }

  async function exporter(id: IdDocument) {
    const doc = donneesParDocument[id];
    if (!doc) return;
    setExportEnCoursId(id);
    try {
      await exporterPdf(doc);
    } finally {
      setExportEnCoursId(null);
    }
  }

  const documents: { id: IdDocument; titre: string; description: string }[] = [
    {
      id: 'universitaires',
      titre: "Liste des universitaires d'une filière, d'une période",
      description: 'Utilise les filtres Année et Filière ci-dessus.',
    },
    {
      id: 'non-soldes',
      titre: "Liste des universitaires n'ayant pas encore soldé",
      description: 'Utilise le filtre Année ci-dessus (année active si vide).',
    },
    {
      id: 'operations',
      titre: 'Liste des opérations comptables d\u2019une période',
      description: 'Recettes (EP703) et dépenses (EP704) mêlées, triées par date — utilise la Période ci-dessus.',
    },
    {
      id: 'resultat',
      titre: 'Compte de résultat',
      description: 'Synthèse recettes / dépenses / résultat net — utilise la Période ci-dessus.',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Éditions"
        description="Prévisualiser puis générer des documents PDF prêts à imprimer ou archiver"
      />

      {/* ---- Filtres centralisés, communs à tous les exports ---- */}
      <Card className="mb-6">
        <h2 className="mb-1 font-serif text-[15px] font-semibold text-slate-900">Filtres</h2>
        <p className="mb-4 text-xs text-slate-500">
          Chaque document ci-dessous n'utilise que les filtres qui le concernent (laisse-les vides
          pour "toutes années" / "toutes filières" / "depuis le début"). Change un filtre pour
          rafraîchir l'aperçu déjà ouvert.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Année universitaire</label>
            <select
              value={anneeUniversitaireId}
              onChange={(e) => {
                setAnneeUniversitaireId(e.target.value);
                reinitialiserApercu('universitaires');
                reinitialiserApercu('non-soldes');
              }}
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
              onChange={(e) => {
                setFiliereId(e.target.value);
                reinitialiserApercu('universitaires');
              }}
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
              onChange={(e) => {
                setDateDebut(e.target.value);
                reinitialiserApercu('operations');
                reinitialiserApercu('resultat');
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Période — au</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => {
                setDateFin(e.target.value);
                reinitialiserApercu('operations');
                reinitialiserApercu('resultat');
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>

      {/* ---- Documents disponibles, aperçu dépliable directement sous chacun ---- */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="overflow-hidden p-0">
            <button
              onClick={() => basculerApercu(doc.id)}
              className="flex w-full flex-col items-start justify-between gap-3 px-5 py-4 text-left sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.titre}</p>
                <p className="text-xs text-slate-500">{doc.description}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                <Eye className="h-4 w-4" />
                {documentOuvert === doc.id ? 'Masquer' : "Voir l'aperçu"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${documentOuvert === doc.id ? 'rotate-180' : ''}`}
                />
              </span>
            </button>

            {documentOuvert === doc.id && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                {chargementId === doc.id ? (
                  <p className="py-6 text-center text-sm text-slate-500">Chargement de l'aperçu...</p>
                ) : donneesParDocument[doc.id] ? (
                  <>
                    <div className="mb-3">
                      <p className="font-serif text-sm font-semibold text-slate-900">
                        {donneesParDocument[doc.id]!.titre}
                      </p>
                      {donneesParDocument[doc.id]!.sousTitre && (
                        <p className="text-xs text-slate-500">{donneesParDocument[doc.id]!.sousTitre}</p>
                      )}
                    </div>
                    {donneesParDocument[doc.id]!.lignes.length === 0 ? (
                      <p className="py-4 text-center text-sm text-slate-500">
                        Aucune donnée pour cette sélection.
                      </p>
                    ) : (
                      <div className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full min-w-[480px] text-sm">
                          <thead className="sticky top-0 border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                            <tr>
                              {donneesParDocument[doc.id]!.colonnes.map((col) => (
                                <th key={col} className="px-3 py-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {donneesParDocument[doc.id]!.lignes.map((ligne, i) => (
                              <tr key={i}>
                                {ligne.map((cellule, j) => (
                                  <td key={j} className="px-3 py-2 text-slate-700">
                                    {cellule}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {donneesParDocument[doc.id]!.pied && (
                      <p className="mt-3 text-right text-sm font-semibold text-slate-900">
                        {donneesParDocument[doc.id]!.pied}
                      </p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => exporter(doc.id)}
                        isLoading={exportEnCoursId === doc.id}
                        disabled={donneesParDocument[doc.id]!.lignes.length === 0}
                      >
                        <FileDown className="h-4 w-4" />
                        Exporter en PDF
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
