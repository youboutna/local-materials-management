/**
 * PdfBoqParser — extracts BOQ rows from PDF using Y-clustering of pdfjs text items
 * with X-column detection, and falls back to OCR (tesseract.js) when no text is
 * extractable (scanned PDFs).
 *
 * Emits a `ParseResult` compatible with `ImportMappingWizard` (columns are
 * `col_1..col_N` derived from detected column bands).
 */
import type { IDocumentParser, ParseResult, ParsedBoqRow, DetectedFiscal } from './IDocumentParser';
import { extractDocumentParties } from './headerDetection';
import { extractEnvelope, isEnvelopeRow, summarizeEnvelope } from './envelopeDetection';
import { extractFiscalFromRow, isFiscalMetaRow, isSubtotalRow, summarizeFiscal } from './fiscalDetection';
import { assembleLogicalRows } from './rowAssembly';
import { repairOcrMatrix } from './ocrNormalization';
import { segmentDocumentBlocks } from './documentBlocks';


import {
  detectSection,
  detectSecondaryHeader,
  isRepeatedHeaderRow,
  SECTION_KIND_COLUMN,
  SECTION_LABEL_COLUMN,
  SECTION_LOT_COLUMN,
  type DetectedSection,
} from './sectionDetection';

interface PdfItem { str: string; transform: number[]; width?: number }

/** Fragment de texte positionné (une « cellule » avant alignement sur les bandes). */
interface Cell { text: string; x0: number; x1: number }

const Y_TOLERANCE = 3;    // px — items within this Y delta share a row
const X_GAP = 20;         // px — horizontal gap threshold that splits columns

const centerOf = (c: { x0: number; x1: number }) => (c.x0 + c.x1) / 2;

/** Regroupe les items d'une ligne en cellules positionnées (x0/x1 conservés). */
function toCells(row: PdfItem[]): Cell[] {
  const sorted = [...row].sort((a, b) => a.transform[4] - b.transform[4]);
  const cells: Cell[] = [];
  let curr: Cell | null = null;
  for (const it of sorted) {
    const x = it.transform[4];
    const w = it.width ?? 0;
    if (curr && x - curr.x1 > X_GAP) { cells.push(curr); curr = null; }
    if (!curr) curr = { text: it.str.trim(), x0: x, x1: x + w };
    else { curr.text = `${curr.text} ${it.str.trim()}`.trim(); curr.x1 = Math.max(curr.x1, x + w); }
  }
  if (curr && curr.text) cells.push(curr);
  return cells;
}

/**
 * Aligne les cellules d'une ligne sur les bandes de colonnes de l'en-tête.
 * Sans cet alignement, un numéro de séquence collé au libellé (« 1 Câble
 * U-1000 RO2V ») décale toutes les colonnes suivantes (Qté / PU / Montant
 * deviennent introuvables) et les retours à la ligne du libellé ne peuvent
 * plus être rattachés à la colonne Désignation.
 */
function alignToBands(cells: Cell[], bands: Cell[]): string[] {
  const out: string[] = Array.from({ length: bands.length }, () => '');
  for (const cell of cells) {
    let best = 0;
    let bestScore = -Infinity;
    bands.forEach((band, i) => {
      const overlap = Math.min(cell.x1, band.x1) - Math.max(cell.x0, band.x0);
      const score = overlap > 0 ? overlap : -Math.abs(centerOf(cell) - centerOf(band));
      if (score > bestScore) { bestScore = score; best = i; }
    });
    out[best] = out[best] ? `${out[best]} ${cell.text}`.trim() : cell.text;
  }
  return out;
}

/**
 * Affecte chaque fragment PDF à une colonne AVANT de recomposer son texte.
 * C'est indispensable lorsque le numéro de ligne touche visuellement la
 * désignation : une cellule pré-fusionnée « 1 Câble… » ne peut plus être
 * séparée correctement après coup.
 */
function alignItemsToBands(items: PdfItem[], bands: Cell[]): string[] {
  const out: string[] = Array.from({ length: bands.length }, () => '');
  if (!bands.length) return out;
  // Frontières placées dans l'espace ENTRE deux bandes d'en-tête : les valeurs
  // numériques étant alignées à droite, un découpage sur les centres ferait
  // basculer un P.U. dans la colonne Montant (« 200 120 000 »).
  const boundaries = bands.slice(0, -1).map((band, index) => {
    const next = bands[index + 1];
    return next.x0 > band.x1 ? (band.x1 + next.x0) / 2 : (centerOf(band) + centerOf(next)) / 2;
  });
  for (const item of [...items].sort((a, b) => a.transform[4] - b.transform[4])) {
    const text = item.str.trim();
    if (!text) continue;
    const center = item.transform[4] + (item.width ?? 0) / 2;
    let column = boundaries.findIndex((boundary) => center < boundary);
    if (column < 0) column = bands.length - 1;
    out[column] = out[column] ? `${out[column]} ${text}` : text;
  }
  return out;
}


export class PdfBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    return file.name.toLowerCase().endsWith('.pdf');
  }

  async parse(file: File): Promise<ParseResult> {
    const pdfjs = await import('pdfjs-dist');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(pdfjs as any).GlobalWorkerOptions.workerSrc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }
    const buf = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (pdfjs as any).getDocument({ data: buf.slice(0) }).promise;

    const cellRows: Cell[][] = [];
    const itemRows: PdfItem[][] = [];
    let rowsAcc: string[][] = [];
    const warnings: string[] = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items = (content.items as PdfItem[]).filter((i) => i && i.str && i.str.trim());
      if (!items.length) continue;

      // Cluster items into rows by Y within tolerance
      const rows: PdfItem[][] = [];
      const sortedByY = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
      let currentY: number | null = null;
      let bucket: PdfItem[] = [];
      for (const it of sortedByY) {
        const y = it.transform[5];
        if (currentY === null || Math.abs(y - currentY) <= Y_TOLERANCE) {
          bucket.push(it);
          currentY = currentY ?? y;
        } else {
          rows.push(bucket);
          bucket = [it];
          currentY = y;
        }
      }
      if (bucket.length) rows.push(bucket);

      for (const row of rows) {
        const cells = toCells(row);
        if (cells.length) {
          cellRows.push(cells);
          itemRows.push(row);
        }
      }
    }

    // OCR fallback for scanned PDFs
    if (!cellRows.length) {
      warnings.push('Aucun texte extractible du PDF — bascule sur OCR.');
      try {
        const ocrRows = await runOcrFallback(doc);
        rowsAcc.push(...ocrRows);
        if (!ocrRows.length) warnings.push('OCR n’a rien détecté — vérifiez la qualité du scan.');
      } catch (e) {
        warnings.push(`OCR indisponible: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // DQE header detection: promote the first row that matches ≥2 known BOQ
    // headers to the column labels so downstream fuzzy mapping (BoqImportOrchestrator)
    // can auto-map Désignation/Qté/Unité/PU/Montant.
    const HEADER_HINTS: RegExp[] = [
      /d[eé]signation|libell[eé]|description|intitul/i,
      /^unit[eé]?$|^u\.?$|^um$/i,
      /qu?antit[eé]|^qt[eé]?$|^qty$/i,
      /prix.*unit|^p\.?\s*u\.?$|^pu$/i,
      /montant|^total$|prix.*total|^p\.?\s*t\.?$/i,
      /^n[°o]$|^#$|^lot$|chapitre|poste/i,
    ];
    const looksHeader = (row: string[]) => row.reduce((n, c) => n + (HEADER_HINTS.some((rx) => rx.test(c)) ? 1 : 0), 0);

    // Alignement sur les bandes de l'en-tête quand un en-tête est identifié.
    let bandHeaderIdx = -1;
    if (cellRows.length) {
      for (let i = 0; i < Math.min(cellRows.length, 25); i++) {
        if (looksHeader(cellRows[i].map((c) => c.text)) >= 2) { bandHeaderIdx = i; break; }
      }
      const bands = bandHeaderIdx >= 0 ? cellRows[bandHeaderIdx] : null;
      rowsAcc = cellRows.map((cells, index) => (
        bands ? alignItemsToBands(itemRows[index] ?? [], bands) : cells.map((c) => c.text)
      ));
    }
    // Réparation des mots coupés par les colonnes étroites / l'OCR
    // (« Fournit ure de matière I » → « Fourniture de matériel », « forfa it »
    // → « forfait », « Unit é PDF » → « Unité »).
    if (rowsAcc.length) rowsAcc = repairOcrMatrix(rowsAcc);



    let headerIdx = bandHeaderIdx;
    if (headerIdx < 0) {
      for (let i = 0; i < Math.min(rowsAcc.length, 15); i++) {
        if (looksHeader(rowsAcc[i]) >= 2) { headerIdx = i; break; }
      }
    }
    const maxCols = rowsAcc.reduce((m, r) => Math.max(m, r.length), 0);
    const baseColumns: string[] = headerIdx >= 0
      ? Array.from({ length: maxCols }, (_, i) => {
          const label = (rowsAcc[headerIdx][i] ?? '').trim();
          return label || `col_${i + 1}`;
        })
      : Array.from({ length: maxCols }, (_, i) => `col_${i + 1}`);

    const columns = [...baseColumns, SECTION_LOT_COLUMN, SECTION_LABEL_COLUMN, SECTION_KIND_COLUMN];

    // Colonnes canoniques du tableau principal (pour réaligner les en-têtes
    // secondaires — bloc RH « Rôle / Nb Jours / Taux Journalier / Total Base »).
    const findCol = (rx: RegExp) => baseColumns.find((c) => rx.test(c));
    const canonical = {
      designation: findCol(/d[eé]signation|libell|description|intitul/i),
      unit: findCol(/^unit[eé]?$/i),
      quantity: findCol(/qu?antit[eé]|^qt[eé]?$|^qty$/i),
      unitPrice: findCol(/prix.*unit|^p\.?\s*u\.?|^pu\b/i),
      total: findCol(/montant|^total/i),
    };

    // En-tête administratif (Expéditeur → fournisseur / Destinataire → organisation).
    const parties = extractDocumentParties(rowsAcc, headerIdx >= 0 ? headerIdx : undefined);
    const consumed = new Set(parties.consumedRows);
    if (parties.supplier?.name || parties.organization?.name) {
      warnings.push(
        `En-tête détecté : fournisseur « ${parties.supplier?.name ?? '—'} », organisation « ${parties.organization?.name ?? '—'} ».`,
      );
    }

    // Enveloppe documentaire (émetteur / destinataire / réf. / normes) : lue
    // comme CONTEXTE, ses lignes sont retirées du corps des lignes DQE.
    const { envelope, consumedRows: envelopeRows } = extractEnvelope(rowsAcc);
    envelopeRows.forEach((i) => consumed.add(i));
    if (envelope.emitter.name && !parties.supplier?.name) {
      parties.supplier = { ...(parties.supplier ?? {}), name: envelope.emitter.name, address: envelope.emitter.address, phone: envelope.emitter.phone, email: envelope.emitter.email };
    }
    if (envelope.receiver.name && !parties.organization?.name) {
      parties.organization = { ...(parties.organization ?? {}), name: envelope.receiver.name };
    }
    warnings.push(...summarizeEnvelope(envelope));

    // Segmentation en blocs : tout ce qui précède le tableau (émetteur, adresse,
    // n° DQE, date, projet…) est du CONTEXTE, jamais une ligne DQE.
    const blocks = segmentDocumentBlocks(rowsAcc, {
      headerIdx,
      isSectionRow: (cells) => !!detectSection(cells as (string | null)[]),
    });
    blocks.headerRows.forEach((i) => consumed.add(i));
    if (blocks.headerRows.length) {
      warnings.push(`${blocks.headerRows.length} ligne(s) d'en-tête documentaire lues comme métadonnées (hors lignes DQE).`);
    }

    // Recomposition des lignes LOGIQUES (wrap de libellé, régime fiscal sur une
    // ligne à part…) avant toute interprétation métier.
    if (headerIdx >= 0) {
      const designationIdx = Math.max(0, baseColumns.findIndex((c) => /d[eé]signation|libell|description|intitul/i.test(c)));
      const numericIdx = baseColumns
        .map((c, i) => (/qu?antit|^qt|prix|^p\.?\s*u|montant|^total|tva|^unit/i.test(c) ? i : -1))
        .filter((i) => i >= 0);
      const absorbed = assembleLogicalRows(rowsAcc, {
        headerIdx,
        designationIdx,
        numericIdx,
        consumed,
        isBoundary: (cells) => !!detectSection(cells) || isRepeatedHeaderRow(cells, baseColumns),
      });
      if (absorbed) warnings.push(`${absorbed} ligne(s) de continuation fusionnée(s) avec leur ligne d'origine.`);

      // Colonnes numériques collées par l'extraction (« 200 120 000 » = P.U.
      // 200 + Montant 120 000) : on les redistribue grâce à l'égalité
      // quantité × P.U. = montant.
      const qtyIdx = baseColumns.findIndex((c) => /qu?antit[eé]|^qt[eé]?$|^qty$/i.test(c));
      const puIdx = baseColumns.findIndex((c) => /prix.*unit|^p\.?\s*u\.?|^pu\b/i.test(c));
      const totalIdx = baseColumns.findIndex((c) => /montant|^total/i.test(c));
      const unitIdx = baseColumns.findIndex((c) => /^unit[eé]?$/i.test(c));
      if (qtyIdx >= 0 && puIdx >= 0 && totalIdx >= 0) {
        for (let i = 0; i < rowsAcc.length; i++) {
          if (i === headerIdx || consumed.has(i)) continue;
          splitMergedAmounts(rowsAcc[i], { qtyIdx, puIdx, totalIdx, unitIdx });
        }
      }
    }


    // Les lignes « LOT … » précédant l'en-tête doivent rester visibles pour le
    // contexte : on parcourt donc toutes les lignes et on saute l'en-tête détecté.
    const detectedFiscal: DetectedFiscal = {};
    const parsedRows: ParsedBoqRow[] = [];
    let section: DetectedSection | null = null;
    let sectionsFound = 0;
    let remap: Record<number, string> | null = null;

    for (let i = 0; i < rowsAcc.length; i++) {
      if (i === headerIdx || consumed.has(i)) continue;
      const cells = rowsAcc[i];
      // Les pieds de tableau (« Total HT », « TVA (5%) ») sont alignés à droite :
      // le libellé n'est pas forcément dans la première colonne.
      const label = String(cells.find((c) => String(c ?? '').trim()) ?? '').trim();


      const nextSection = detectSection(cells);
      if (nextSection) { section = nextSection; sectionsFound += 1; remap = null; continue; }
      if (headerIdx >= 0 && isRepeatedHeaderRow(cells, baseColumns)) { remap = null; continue; }
      const secondary = detectSecondaryHeader(cells, canonical);
      if (secondary) { remap = secondary; continue; }

      if (isFiscalMetaRow(label) || /^(sous[-\s]?total\s+g[eé]n[eé]ral|total\s+(?:mat[eé]riel|hr|rh|g[eé]n[eé]ral)?\s*(?:ht|ttc)?)/i.test(label)) {
        extractFiscalFromRow(cells, detectedFiscal);
        continue;
      }
      if (isSubtotalRow(label)) continue;
      // Filet de sécurité : bruit d'enveloppe (pied de page, mentions Factur-X…).
      if (isEnvelopeRow(cells)) continue;
      const raw: Record<string, string | number | null> = {};
      cells.forEach((c, idx) => { raw[remap?.[idx] ?? baseColumns[idx] ?? `col_${idx + 1}`] = c; });
      raw[SECTION_LOT_COLUMN] = section?.lot ?? null;
      raw[SECTION_LABEL_COLUMN] = section?.label ?? null;
      raw[SECTION_KIND_COLUMN] = section?.kind ?? 'material';
      parsedRows.push({ raw });
    }
    if (headerIdx >= 0) warnings.push(`En-têtes DQE détectés ligne ${headerIdx + 1}.`);
    if (sectionsFound) warnings.push(`${sectionsFound} lot(s) détecté(s) depuis les lignes de section.`);
    warnings.push(...summarizeFiscal(detectedFiscal));
    return { rows: parsedRows, columns, warnings, detectedFiscal, parties, envelope };
  }
}

/** Render each page to canvas and OCR with tesseract.js (fra+eng). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runOcrFallback(doc: any): Promise<string[][]> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('fra+eng');
  const rowsAcc: string[][] = [];
  try {
    const maxPages = Math.min(doc.numPages, 10); // safety cap
    for (let p = 1; p <= maxPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      const text = data.text ?? '';
      for (const line of text.split(/\r?\n/)) {
        const cols = line.split(/\s{2,}|\t+/).map((c) => c.trim()).filter(Boolean);
        if (cols.length) rowsAcc.push(cols);
      }
    }
  } finally {
    await worker.terminate();
  }
  return rowsAcc;
}

/**
 * Normalise une ligne d'ouvrage dont l'extraction PDF a collé ou décalé les
 * valeurs (« km 7 », « 200 120 000 »).
 *
 * Principe : on reconstruit unité / quantité / P.U. / montant depuis les jetons
 * situés après la désignation, en validant la partition par l'arithmétique de la
 * ligne (quantité × P.U. = montant). Les lignes déjà cohérentes sont laissées
 * intactes.
 */
function splitMergedAmounts(
  cells: string[],
  idx: { qtyIdx: number; puIdx: number; totalIdx: number; unitIdx: number },
): void {
  const num = (s: string): number | null => {
    const n = Number(String(s).replace(/[^\d,.-]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const groupValue = (tokens: string[]): number | null => num(tokens.join(''));

  const designationIdx = 0;
  const tail = cells
    .map((c, i) => (i === designationIdx ? '' : String(c ?? '')))
    .join(' ')
    .trim();
  if (!tail) return;

  // Unité = premier jeton alphabétique (ml, m², forfait, unité…).
  const tokens = tail.split(/\s+/).filter(Boolean);
  const unitTokens = tokens.filter((t) => /[A-Za-zÀ-ÿ]/.test(t) && !/\d/.test(t));
  const numTokens = tokens.filter((t) => /^[\d.,]+$/.test(t));
  if (numTokens.length < 3) return;

  // Recherche d'une partition quantité / P.U. / montant valide.
  for (let i = 1; i < numTokens.length - 1; i++) {
    for (let j = i + 1; j < numTokens.length; j++) {
      const qty = groupValue(numTokens.slice(0, i));
      const pu = groupValue(numTokens.slice(i, j));
      const total = groupValue(numTokens.slice(j));
      if (!qty || !pu || !total) continue;
      if (Math.abs(qty * pu - total) > Math.max(1, total * 0.005)) continue;
      const fmt = (parts: string[]) => parts.join(' ');
      if (idx.unitIdx >= 0) cells[idx.unitIdx] = unitTokens[0] ?? String(cells[idx.unitIdx] ?? '');
      cells[idx.qtyIdx] = fmt(numTokens.slice(0, i));
      cells[idx.puIdx] = fmt(numTokens.slice(i, j));
      cells[idx.totalIdx] = fmt(numTokens.slice(j));
      for (let k = 0; k < cells.length; k++) {
        if (k === designationIdx || k === idx.unitIdx || k === idx.qtyIdx || k === idx.puIdx || k === idx.totalIdx) continue;
        if (/^[\d\s.,]+$/.test(String(cells[k] ?? '').trim())) cells[k] = '';
      }
      return;
    }
  }
}


