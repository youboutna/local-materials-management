/**
 * BoqPdfRenderer — Renders a full BOQ document to PDF (header, lines table,
 * totals HT/TVA/TTC, paginated footer). Pure TS, uses jsPDF + jspdf-autotable.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BoqCalculatorService } from './BoqCalculatorService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface BoqPdfContext {
  title: string;
  docPrefix: string;
  docNumber?: string;
  projectId?: string;
  tenderId?: string;
  submissionId?: string;
  senderName?: string;
  recipientName?: string;
  currency?: string;
  signed?: boolean;
  signedBy?: string;
  signedAt?: string;
}

export const BoqPdfRenderer = {
  render(lines: BoqLineDTO[], ctx: BoqPdfContext): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const currency = ctx.currency ?? 'MRU';
    const now = new Date();
    const stamp = now.toLocaleDateString('fr-FR');
    const docNumber = ctx.docNumber ?? `${ctx.docPrefix.toUpperCase()}-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;

    // Header
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(ctx.title, 40, 50);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`N° ${docNumber}`, 40, 68);
    doc.text(`Date : ${stamp}`, 40, 82);

    let refY = 68;
    const rightX = 555;
    if (ctx.senderName)    { doc.text(`Émetteur : ${ctx.senderName}`,    rightX, refY, { align: 'right' }); refY += 14; }
    if (ctx.recipientName) { doc.text(`Destinataire : ${ctx.recipientName}`, rightX, refY, { align: 'right' }); refY += 14; }
    if (ctx.projectId)     { doc.text(`Projet : ${ctx.projectId.slice(0, 8)}`, rightX, refY, { align: 'right' }); refY += 14; }
    if (ctx.tenderId)      { doc.text(`Appel d'offres : ${ctx.tenderId.slice(0, 8)}`, rightX, refY, { align: 'right' }); refY += 14; }

    // Body — lines table
    const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    const body = lines.map((l, i) => {
      const qty = Number(l.quantity ?? 0);
      const pu = Number(l.unitPrice ?? 0);
      const total = Number(l.totalHt ?? qty * pu);
      return [
        String(i + 1),
        l.designation ?? '',
        l.resourceType ?? '',
        fmt(qty),
        l.unit ?? '',
        fmt(pu),
        `${((l.vatRate ?? 0) * 100).toFixed(0)} %`,
        fmt(total),
      ];
    });

    autoTable(doc, {
      startY: 110,
      head: [['#', 'Désignation', 'Type', 'Qté', 'Unité', 'PU', 'TVA', `Total HT (${currency})`]],
      body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 180 },
        3: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });

    // Totals
    const totals = BoqCalculatorService.aggregate(
      lines.map((l) => ({
        unit: l.unit ?? 'u',
        quantity: l.quantity ?? 0,
        unitPrice: l.unitPrice ?? 0,
        vatRate: l.vatRate ?? 0,
      })),
    );
    const afterTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;
    let ty = afterTable + 24;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(`Total HT :   ${fmt(totals.totalHt)} ${currency}`, rightX, ty, { align: 'right' }); ty += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(`TVA :        ${fmt(totals.totalTva)} ${currency}`, rightX, ty, { align: 'right' }); ty += 14;
    const ras = totals.withholding ?? 0;
    if (ras > 0) {
      doc.text(`RAS :        ${fmt(ras)} ${currency}`, rightX, ty, { align: 'right' }); ty += 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`Total TTC :  ${fmt(totals.totalTtc)} ${currency}`, rightX, ty, { align: 'right' });

    // Signature
    if (ctx.signed) {
      ty += 30;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(9);
      doc.text(`Document signé électroniquement${ctx.signedBy ? ` par ${ctx.signedBy}` : ''}${ctx.signedAt ? ` le ${ctx.signedAt}` : ''}`, 40, ty);
    }

    // Footer paginated
    const pageCount = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(`${ctx.title} — ${docNumber}`, 40, 820);
      doc.text(`Page ${i}/${pageCount}`, rightX, 820, { align: 'right' });
    }

    return doc.output('blob');
  },
};
