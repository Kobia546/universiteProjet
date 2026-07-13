interface ExportPdfOptions {
  titre: string;
  sousTitre?: string;
  colonnes: string[];
  lignes: (string | number)[][];
  nomFichier: string;
  /** Affiché en bas de tableau, ex: total général */
  pied?: string;
}

/**
 * Génère un PDF avec l'en-tête de l'université, un tableau de données, et
 * le déclenche en téléchargement. Utilisé pour tous les exports (recettes,
 * dépenses, étudiants...) afin de garder une mise en page cohérente.
 *
 * jsPDF est chargé en différé (dynamic import) pour ne pas alourdir le
 * bundle principal — il n'est téléchargé que lorsqu'un export est demandé.
 */
export async function exporterPdf({
  titre,
  sousTitre,
  colonnes,
  lignes,
  nomFichier,
  pied,
}: ExportPdfOptions) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();

  // En-tête
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(32, 77, 58); // vert institutionnel
  doc.text('Filières Professionnalisées UFR SJAP', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('BP V179 · Cel. : 01 41 03 17 24 / 01 40 83 56 52', 14, 24);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 28, 196, 28);

  // Titre du document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(titre, 14, 38);

  if (sousTitre) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(sousTitre, 14, 44);
  }

  autoTable(doc, {
    startY: sousTitre ? 50 : 44,
    head: [colonnes],
    body: lignes,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [43, 98, 73], textColor: 255 }, // vert institutionnel
    alternateRowStyles: { fillColor: [247, 245, 240] },
  });

  if (pied) {
    const finTableau = (doc as any).lastAutoTable.finalY || 50;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(pied, 14, finTableau + 10);
  }

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`${nomFichier}-${date}.pdf`);
}
