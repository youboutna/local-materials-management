/**
 * BoqPdfRenderer — Rendu PDF conforme à la doctrine documentaire (D1 → D5).
 *
 *  D1 — Entêtes normalisés : nom de projet métier, émetteur / destinataire
 *       explicites, date ISO 8601, référence `PREFIX-YYYYMMDD-XXXX`.
 *  D2 — Aucun code technique en désignation (résolu par DocumentIdentityService),
 *       descriptions non tronquées (retour à la ligne automatique).
 *  D3 — Unités standardisées (référentiel unit-codes) et montants formatés
 *       `XXX XXX,XX` via `reportNumbers` (espaces fines normalisées).
 *  D4 — TVA homogène : taux issu du profil fiscal quand la ligne n'en porte pas,
 *       détail TVA par ligne, totaux recalculés sur la même base.
 *  D5 — Bloc validation / signature unifié sur tous les documents.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BoqCalculatorService } from './BoqCalculatorService';
import { DocumentIdentityService } from './DocumentIdentityService';
import { documentUnitLabel } from '@/config/referentials/boq/unit-codes.referential';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { formatNumber2, sanitizeNumberSpaces } from '@/utils/reportNumbers';
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
  documentId?: string | null;
  senderName?: string;
  recipientName?: string;
  currency?: string;
  /** Profil fiscal appliqué (TVA / RAS homogènes). */
  fiscalProfileCode?: string | null;
  signed?: boolean;
  signedBy?: string;
  signedAt?: string;
  company?: BoqPdfCompany;
  termsConditions?: string;
  notes?: string;
  validityDays?: number;
  /** Étape du cycle documentaire (référentiel invoice-document-types). */
  documentStage?: string;
  /** TypeCode UNTDID 1001 (310 devis/commande, 380 facture). */
  facturxTypeCode?: string;
  /** Statut métier de l'étape (« demande », « signe », « payee »…). */
  businessStatus?: string;
  /** Avancement facturé pour les décomptes (%). */
  billedPercentage?: number | null;
  /** Référence documentaire (numéro Factur-X). */
  reference?: string;
  /** Date d'émission ISO (stable, sinon dérivée de la création des lignes). */
  issueDate?: string | null;
}

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

/** Conditions générales contextualisées au document en cours (D4 doctrine §4). */
function buildTerms(ctx: BoqPdfContext, args: { validity: number; validUntil: string; currency: string; vatRate: number; rasRate: number; reference: string }): string {
  const scope = ctx.projectTitle ? `projet « ${ctx.projectTitle} »` : 'projet concerné';
  const tender = ctx.tenderTitle ? ` — appel d’offres « ${ctx.tenderTitle} »` : '';
  return [
    'CONDITIONS GÉNÉRALES:',
    `1. Document : ${ctx.title}${ctx.documentStage ? ` (${ctx.documentStage})` : ''} — référence ${args.reference}, rattaché au ${scope}${tender}.`,
    `2. Validité de l'offre : ${args.validity} jours, soit jusqu'au ${args.validUntil}.`,
    `3. Devise et prix : montants exprimés en ${args.currency}, fermes et définitifs hors révision exceptionnelle.`,
    `4. Fiscalité appliquée : TVA ${formatNumber2(args.vatRate * 100)} % — retenue à la source ${formatNumber2(args.rasRate * 100)} % sur le montant hors taxes.`,
    ctx.billedPercentage != null
      ? `5. Avancement facturé : ${formatNumber2(ctx.billedPercentage)} % des quantités contractuelles du ${scope}.`
      : '5. Délais et modalités de paiement : conformes au contrat et au cahier des charges du projet.',
    '6. Conformité aux normes et réglementations en vigueur, ainsi qu’à la norme EN 16931 (Factur-X) pour l’échange dématérialisé.',
  ].join('\n');
}

export const BoqPdfRenderer = {
  render(lines: BoqLineDTO[], ctx: BoqPdfContext): Blob {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const profile = getFiscalProfile(ctx.fiscalProfileCode);
    const currency = ctx.currency ?? profile.currency ?? 'MRU';

    // ---- D1 : identité documentaire stable (référence + date ISO) ----
    const identity = DocumentIdentityService.resolve({
      docPrefix: ctx.docPrefix,
      contextId: ctx.projectId ?? ctx.tenderId ?? ctx.submissionId,
      documentId: ctx.documentId ?? null,
      lines,
      reference: ctx.docNumber ?? ctx.reference ?? null,
      issueDate: ctx.issueDate ?? null,
    });
    const docNumber = identity.reference;
    const issueDate = identity.issueDateIso;
    const validity = ctx.validityDays ?? 30;
    const validUntil = new Date(new Date(identity.issueDateTimeIso).getTime() + validity * 86400_000)
      .toISOString()
      .slice(0, 10);
    const fmt = (n: number) => formatNumber2(n);
    const amount = (n: number) => `${formatNumber2(n)} ${currency}`;
    const rightX = 555;

    // ---- Company header band ----
    doc.setFillColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.rect(0, 0, 595, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(sanitizeNumberSpaces(ctx.company?.name ?? ctx.senderName ?? '—'), 40, 32);
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
    doc.text(`Date : ${issueDate}`, rightX, 60, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    let y = 90;

    // ---- Bloc contexte projet / AO (D1 : libellés métier uniquement) ----
    y = section(doc, y, 'Contexte', COLOR.primary);
    doc.setFillColor(COLOR.softBg[0], COLOR.softBg[1], COLOR.softBg[2]);
    doc.roundedRect(40, y, 515, 60, 4, 4, 'F');
    doc.setFontSize(9);
    const cy = y + 14;
    const leftPairs: Array<[string, string]> = [
      ['Projet',         ctx.projectTitle ?? '—'],
      ['Appel d’offres', ctx.tenderTitle ?? '—'],
      ['Validité',       `${validity} j (jusqu’au ${validUntil})`],
    ];
    const rightPairs: Array<[string, string]> = [
      ['Émetteur',     ctx.company?.name ?? ctx.senderName ?? '—'],
      ['Destinataire', ctx.recipientName ?? '—'],
      ['Devise',       currency],
    ];
    leftPairs.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.text(`${k} :`, 52, cy + i * 14);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(sanitizeNumberSpaces(v), 150).slice(0, 1), 130, cy + i * 14);
    });
    rightPairs.forEach(([k, v], i) => {
      doc.setFont('helvetica', 'bold'); doc.text(`${k} :`, 310, cy + i * 14);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(sanitizeNumberSpaces(v), 165), 380, cy + i * 14, { maxWidth: 165 });
    });
    y += 74;

    // ---- Bandeau étape documentaire (cycle DQE → Facture / Factur-X) ----
    if (ctx.documentStage || ctx.facturxTypeCode || ctx.billedPercentage != null) {
      const chips: string[] = [];
      if (ctx.documentStage) chips.push(`Étape : ${ctx.documentStage}`);
      if (ctx.businessStatus) chips.push(`Statut : ${ctx.businessStatus}`);
      if (ctx.facturxTypeCode) chips.push(`Factur-X / EN 16931 · TypeCode ${ctx.facturxTypeCode}`);
      if (ctx.billedPercentage != null) chips.push(`Avancement facturé : ${formatNumber2(ctx.billedPercentage)} %`);
      chips.push(`Réf. ${docNumber}`);

      const chipText = doc.splitTextToSize(sanitizeNumberSpaces(chips.join('   |   ')), 495) as string[];
      const bandH = chipText.length * 11 + 14;
      doc.setFillColor(240, 253, 250);
      doc.setDrawColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
      doc.roundedRect(40, y, 515, bandH, 4, 4, 'FD');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
      doc.text(chipText, 52, y + 13);
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
      y += bandH + 14;
    }

    // ---- Lignes (D2/D3/D4) ----
    y = section(doc, y, 'Détail des postes', COLOR.accent);
    const normalized = lines.map((l) => {
      const quantity = Number(l.quantity ?? 0);
      const unitPrice = Number(l.unitPrice ?? 0);
      const totalHt = Number(l.totalHt ?? quantity * unitPrice + Number(l.fees ?? 0));
      const vatRate = l.vatRate ?? profile.vatRate;
      const rasRate = l.rasRate ?? profile.withholdingRate;
      return { line: l, quantity, unitPrice, totalHt, vatRate, rasRate, totalTva: totalHt * vatRate };
    });

    const body = normalized.map((n, i) => [
      String(i + 1),
      sanitizeNumberSpaces(DocumentIdentityService.lineLabel(n.line, i)),
      DocumentIdentityService.lineCode(n.line) || (n.line.resourceType ?? ''),
      fmt(n.quantity),
      documentUnitLabel(n.line.unit),
      fmt(n.unitPrice),
      `${formatNumber2(n.vatRate * 100)} %`,
      fmt(n.totalTva),
      fmt(n.totalHt),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Désignation', 'Réf. / Type', 'Qté', 'Unité', `PU (${currency})`, 'TVA', `TVA (${currency})`, `Total HT (${currency})`]],
      body,
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: COLOR.accent, textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 150 },
        2: { cellWidth: 62 },
        3: { cellWidth: 42, halign: 'right' },
        4: { cellWidth: 34 },
        5: { cellWidth: 60, halign: 'right' },
        6: { cellWidth: 40, halign: 'right' },
        7: { cellWidth: 52, halign: 'right' },
        8: { halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30;

    // ---- Récap financier (D4 : même base fiscale que les lignes) ----
    y += 20;
    if (y > 640) { doc.addPage(); y = 60; }
    y = section(doc, y, 'Récapitulatif financier', COLOR.primary);
    const totals = BoqCalculatorService.aggregate(
      normalized.map((n) => ({
        unit: n.line.unit ?? 'u',
        quantity: n.quantity,
        unitPrice: n.unitPrice,
        vatRate: n.vatRate,
        rasRate: n.rasRate,
        fees: n.line.fees ?? 0,
      })),
      profile,
    );
    const totalHt = normalized.reduce((s, n) => s + n.totalHt, 0);
    const totalTva = normalized.reduce((s, n) => s + n.totalTva, 0);
    const ras = normalized.reduce((s, n) => s + n.totalHt * n.rasRate, 0);
    const totalTtc = totalHt + totalTva;
    void totals;

    doc.setDrawColor(226, 232, 240);
    const boxH = ras > 0 ? 106 : 90;
    doc.roundedRect(300, y, 255, boxH, 4, 4, 'S');
    doc.setFontSize(10);
    let ty = y + 16;
    doc.setFont('helvetica', 'normal');
    doc.text('Total HT', 315, ty); doc.text(amount(totalHt), 545, ty, { align: 'right' }); ty += 16;
    doc.text(`TVA (${formatNumber2(profile.vatRate * 100)} %)`, 315, ty);
    doc.text(amount(totalTva), 545, ty, { align: 'right' }); ty += 16;
    if (ras > 0) {
      doc.text(`RAS (${formatNumber2(profile.withholdingRate * 100)} %)`, 315, ty);
      doc.text(`- ${amount(ras)}`, 545, ty, { align: 'right' });
      ty += 16;
    }
    doc.setDrawColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.line(310, ty - 6, 550, ty - 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(COLOR.primary[0], COLOR.primary[1], COLOR.primary[2]);
    doc.text('Total TTC', 315, ty + 6);
    doc.text(amount(totalTtc), 545, ty + 6, { align: 'right' });
    if (ras > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.setTextColor(COLOR.muted[0], COLOR.muted[1], COLOR.muted[2]);
      doc.text('Net à payer', 315, ty + 22);
      doc.text(amount(totalTtc - ras), 545, ty + 22, { align: 'right' });
    }
    doc.setTextColor(0, 0, 0);
    y += boxH + 14;

    // ---- Conditions générales contextualisées ----
    if (y > 640) { doc.addPage(); y = 60; }
    y = section(doc, y, 'Conditions générales', COLOR.warn);
    doc.setFillColor(255, 251, 235);
    const termsText = ctx.termsConditions ?? buildTerms(ctx, {
      validity, validUntil, currency,
      vatRate: profile.vatRate, rasRate: profile.withholdingRate,
      reference: docNumber,
    });
    const wrapped = doc.splitTextToSize(sanitizeNumberSpaces(termsText), 495) as string[];
    const th = wrapped.length * 11 + 14;
    doc.roundedRect(40, y, 515, th, 4, 4, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(wrapped, 52, y + 14);
    doc.setTextColor(0, 0, 0);
    y += th + 20;

    // ---- Notes optionnelles ----
    if (ctx.notes) {
      if (y > 680) { doc.addPage(); y = 60; }
      y = section(doc, y, 'Notes complémentaires', COLOR.muted);
      const nw = doc.splitTextToSize(sanitizeNumberSpaces(ctx.notes), 495) as string[];
      doc.setFontSize(9); doc.text(nw, 52, y); y += nw.length * 11 + 14;
    }

    // ---- Validation / signature unifiée (D5) ----
    if (y > 660) { doc.addPage(); y = 60; }
    y = section(doc, y, 'Validation', COLOR.muted);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(40, y, 515, 96, 4, 4, 'S');
    doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('Signataire', 55, y + 18);
    doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
    doc.text(sanitizeNumberSpaces(ctx.signedBy ?? ctx.senderName ?? ctx.company?.name ?? '—'), 55, y + 36);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    const signedAtIso = ctx.signedAt ? new Date(ctx.signedAt).toISOString().slice(0, 10) : issueDate;
    doc.text(
      ctx.signed
        ? `Signature électronique — ${signedAtIso}`
        : 'En attente de signature électronique',
      55, y + 52,
    );
    doc.text(`Référence de traçabilité : ${docNumber}`, 55, y + 66);
    doc.text(`Émetteur : ${sanitizeNumberSpaces(ctx.company?.name ?? ctx.senderName ?? '—')}`, 55, y + 80);

    // signature box
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([3, 3], 0);
    doc.roundedRect(340, y + 16, 200, 62, 4, 4, 'S');
    doc.setLineDashPattern([], 0);
    if (ctx.signed) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11);
      doc.setTextColor(COLOR.accent[0], COLOR.accent[1], COLOR.accent[2]);
      doc.text('Signé électroniquement', 440, y + 44, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(signedAtIso, 440, y + 60, { align: 'center' });
    } else {
      doc.setFontSize(9); doc.setTextColor(148, 163, 184);
      doc.text('Signature requise', 440, y + 52, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);

    // ---- Footer paginé ----
    const pageCount = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.line(40, 810, 555, 810);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(`${ctx.title} — ${docNumber} — ${issueDate}`, 40, 824);
      doc.text(`Page ${i}/${pageCount}`, rightX, 824, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    return doc.output('blob');
  },
};
