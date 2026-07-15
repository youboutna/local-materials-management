/**
 * BoqPdfRenderer — Rendu PDF « pro » aligné sur DevisPDFDocument.
 * Sections colorées, header entreprise, bloc infos AO/projet, tableau lignes,
 * récap financier (HT/TVA/RAS/TTC), conditions générales, bloc signature.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BoqCalculatorService } from './BoqCalculatorService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface BoqPdfCompany {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface BoqPdfContext {
  title: string;
  docPrefix: string;
  docNumber?: string;
  projectId?: string;
  projectTitle?: string;
  tenderId?: string;
  tenderTitle?: string;
  submissionId?: string;
  senderName?: string;
  recipientName?: string;
  currency?: string;
  signed?: boolean;
  signedBy?: string;
  signedAt?: string;
  company?: BoqPdfCompany;
  termsConditions?: string;
  notes?: string;
  validityDays?: number;
}

const DEFAULT_TERMS = `CONDITIONS GÉNÉRALES:
1. Validité de l'offre: 30 jours à compter de la date d'émission
2. Délai de livraison: à définir selon cahier des charges
3. Modalités de paiement: selon contrat
4. Prix fermes et définitifs, hors révision exceptionnelle
5. Conformité aux normes et réglementations en vigueur`;

const COLOR = {
  primary: [30, 64, 175] as [number, number, number],   // blue
  accent:  [16, 129, 108] as [number, number, number],  // teal
  warn:    [245, 158, 11] as [number, number, number],  // amber
  muted:   [100, 116, 139] as [number, number, number], // slate
  softBg:  [239, 246, 255] as [number, number, number],
};

function section(doc: jsPDF, y: number, title: string, color: [number, number, number]): number {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(3);
  doc.line(40, y, 40, y + 14);
  doc.setLineWidth(0.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, 50, y + 11);
  doc.setTextColor(0, 0, 0);
  return y + 22;
}

export const BoqPdfRenderer = {
  render(lines: BoqLineDTO[], ctx: BoqPdfContext): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const currency = ctx.currency ?? 'MRU';
    const now = new Date();
    const stamp = now.toLocaleDateString('fr-FR');
    const docNumber = ctx.docNumber ?? `${ctx.docPrefix.toUpperCase()}-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
    const validity = ctx.validityDays ?? 30;
    const validUntil = new Date(now.getTime() + validity * 86400_000).toLocaleDateString('fr-FR');
    const fmt = (n: number) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    const rightX = 555;

    // ---- Company header band ----
    doc.setFillColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.rect(0, 0, 595, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(ctx.company?.name ?? 'Votre Entreprise', 40, 32);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const cLines: string[] = [];
    if (ctx.company?.address) cLines.push(ctx.company.address);
    const contact = [ctx.company?.phone, ctx.company?.email].filter(Boolean).join('  ·  ');
    if (contact) cLines.push(contact);
    cLines.forEach((t, i) => doc.text(t, 40, 48 + i * 12));

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text(ctx.title.toUpperCase(), rightX, 32, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`N° ${docNumber}`, rightX, 48, { align: 'right' });
    doc.text(`Date : ${stamp}`, rightX, 60, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    let y = 90;

    // ---- Bloc contexte projet / AO ----
    y = section(doc, y, 'Contexte', COLOR.primary);
    doc.setFillColor(COLOR.softBg[0], COLOR.softBg[1], COLOR.softBg[2]);
    doc.roundedRect(40, y, 515, 60, 4, 4, 'F');
    doc.setFontSize(9);
    let cy = y + 14;
    const leftPairs: Array<[string, string | undefined]> = [
      ['Projet',           ctx.projectTitle ?? (ctx.projectId ? ctx.projectId.slice(0, 8) : undefined)],
      ['Appel d’offres',   ctx.tenderTitle  ?? (ctx.tenderId  ? ctx.tenderId.slice(0, 8)  : undefined)],
      ['Validité',         `${validity} j (jusqu’au ${validUntil})`],
    ];
    const rightPairs: Array<[string, string | undefined]> = [
      ['Émetteur',    ctx.senderName],
      ['Destinataire',ctx.recipientName],
      ['Devise',      currency],
    ];
    leftPairs.forEach(([k, v], i) => {
      if (!v) return;
      doc.setFont('helvetica', 'bold'); doc.text(`${k} :`, 52, cy + i * 14);
      doc.setFont('helvetica', 'normal'); doc.text(String(v), 130, cy + i * 14);
    });
    rightPairs.forEach(([k, v], i) => {
      if (!v) return;
      doc.setFont('helvetica', 'bold'); doc.text(`${k} :`, 310, cy + i * 14);
      doc.setFont('helvetica', 'normal'); doc.text(String(v), 380, cy + i * 14);
    });
    y += 74;

    // ---- Lignes ----
    y = section(doc, y, 'Détail des postes', COLOR.accent);
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
      startY: y,
      head: [['#', 'Désignation', 'Type', 'Qté', 'Unité', 'PU', 'TVA', `Total HT (${currency})`]],
      body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: COLOR.accent, textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
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
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;

    // ---- Récap financier ----
    y += 20;
    y = section(doc, y, 'Récapitulatif financier', COLOR.primary);
    const totals = BoqCalculatorService.aggregate(
      lines.map((l) => ({
        unit: l.unit ?? 'u',
        quantity: l.quantity ?? 0,
        unitPrice: l.unitPrice ?? 0,
        vatRate: l.vatRate ?? 0,
      })),
    );
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(300, y, 255, 90, 4, 4, 'S');
    doc.setFontSize(10);
    let ty = y + 16;
    doc.setFont('helvetica', 'normal');
    doc.text('Total HT', 315, ty); doc.text(`${fmt(totals.totalHt)} ${currency}`, 545, ty, { align: 'right' }); ty += 16;
    doc.text('TVA',      315, ty); doc.text(`${fmt(totals.totalTva)} ${currency}`, 545, ty, { align: 'right' }); ty += 16;
    const ras = totals.withholding ?? 0;
    if (ras > 0) { doc.text('RAS', 315, ty); doc.text(`- ${fmt(ras)} ${currency}`, 545, ty, { align: 'right' }); ty += 16; }
    doc.setDrawColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.line(310, ty - 6, 550, ty - 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.text('Total TTC', 315, ty + 6);
    doc.text(`${fmt(totals.totalTtc)} ${currency}`, 545, ty + 6, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 104;

    // ---- Conditions générales ----
    if (y > 680) { doc.addPage(); y = 60; }
    y = section(doc, y, 'Conditions générales', COLOR.warn);
    doc.setFillColor(255, 251, 235);
    const termsText = ctx.termsConditions ?? DEFAULT_TERMS;
    const wrapped = doc.splitTextToSize(termsText, 505);
    const th = wrapped.length * 11 + 14;
    doc.roundedRect(40, y, 515, th, 4, 4, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(wrapped, 52, y + 14);
    doc.setTextColor(0, 0, 0);
    y += th + 20;

    // ---- Notes optionnelles ----
    if (ctx.notes) {
      if (y > 700) { doc.addPage(); y = 60; }
      y = section(doc, y, 'Notes complémentaires', COLOR.muted);
      const nw = doc.splitTextToSize(ctx.notes, 505);
      doc.setFontSize(9); doc.text(nw, 52, y); y += nw.length * 11 + 14;
    }

    // ---- Signature ----
    if (y > 680) { doc.addPage(); y = 60; }
    y = section(doc, y, 'Validation', COLOR.muted);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(40, y, 515, 90, 4, 4, 'S');
    doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('Signataire', 55, y + 18);
    doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
    doc.text(ctx.signedBy ?? ctx.senderName ?? '—', 55, y + 36);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text(ctx.signed ? `Signé électroniquement le ${ctx.signedAt ?? stamp}` : 'À signer', 55, y + 52);

    // signature box
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([3, 3], 0);
    doc.roundedRect(340, y + 14, 200, 62, 4, 4, 'S');
    doc.setLineDashPattern([], 0);
    if (ctx.signed) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
      doc.setTextColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
      doc.text('✓ Signé', 440, y + 50, { align: 'center' });
    } else {
      doc.setFontSize(9); doc.setTextColor(148, 163, 184);
      doc.text('Signature requise', 440, y + 50, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);

    // ---- Footer paginé ----
    const pageCount = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(40, 810, 555, 810);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(`${ctx.title} — ${docNumber}`, 40, 824);
      doc.text(`Page ${i}/${pageCount}`, rightX, 824, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    return doc.output('blob');
  },
};
