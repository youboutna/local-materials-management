import jsPDF from 'jspdf';

export async function generatePVPDF(options: {
  title: string;
  phaseName: string;
  decompte: Record<string, any>;
  autoSave?: boolean;
  onUpload?: (fileName: string, blob: Blob) => Promise<void> | void;
}) {
  const doc = new jsPDF({ unit: 'pt' });
  doc.setFontSize(16);
  doc.text(options.title, 40, 60);
  doc.setFontSize(12);
  doc.text(`Phase: ${options.phaseName}`, 40, 90);

  doc.setFontSize(10);
  const lines = [
    `Montant net payable: ${options.decompte.netPayable || 0}`,
    `Pourcentage payable: ${options.decompte.payablePercentage || 0}%`,
  ];
  let y = 120;
  for (const l of lines) {
    doc.text(l, 40, y);
    y += 18;
  }

  // Add metadata block
  doc.setFontSize(9);
  doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 40, y + 12);

  const fileName = `${options.phaseName.replace(/\s+/g, '_')}_PV_${Date.now()}.pdf`;

  // Return blob and optionally auto-save/upload
  const arrayBuf = doc.output('arraybuffer');
  const blob = new Blob([arrayBuf], { type: 'application/pdf' });

  if (options.autoSave) {
    // trigger browser download when running in browser context
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const url = (window as any).URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      (window as any).URL.revokeObjectURL(url);
    } catch (err) {
      // ignore if not in browser
    }
  }

  if (options.onUpload) {
    try {
      await options.onUpload(fileName, blob);
    } catch (err) {
      console.error('Error uploading PV:', err);
    }
  }

  return { fileName, blob, arrayBuffer: arrayBuf };
}
