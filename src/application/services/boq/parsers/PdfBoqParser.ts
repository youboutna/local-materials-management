/**
 * PdfBoqParser — extracts BOQ rows from PDF using Y-clustering of pdfjs text items
 * with X-column detection, and falls back to OCR (tesseract.js) when no text is
 * extractable (scanned PDFs).
 *
 * Emits a `ParseResult` compatible with `ImportMappingWizard` (columns are
 * `col_1..col_N` derived from detected column bands).
 */
import type { IDocumentParser, ParseResult, ParsedBoqRow, DetectedFiscal } from './IDocumentParser';
import { extractFiscalFromRow, isFiscalMetaRow, isSubtotalRow, summarizeFiscal } from './fiscalDetection';

interface PdfItem { str: string; transform: number[]; width?: number }

const Y_TOLERANCE = 3;    // px — items within this Y delta share a row
const X_GAP = 20;         // px — horizontal gap threshold that splits columns

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

    const rowsAcc: string[][] = [];
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

      // Split each row into columns via X-gap heuristic
      for (const row of rows) {
        const sorted = row.sort((a, b) => a.transform[4] - b.transform[4]);
        const cols: string[] = [];
        let curr = '';
        let lastEnd = -Infinity;
        for (const it of sorted) {
          const x = it.transform[4];
          const w = it.width ?? 0;
          if (x - lastEnd > X_GAP && curr) {
            cols.push(curr.trim());
            curr = '';
          }
          curr += (curr ? ' ' : '') + it.str.trim();
          lastEnd = x + w;
        }
        if (curr.trim()) cols.push(curr.trim());
        if (cols.length) rowsAcc.push(cols);
      }
    }

    // OCR fallback for scanned PDFs
    if (!rowsAcc.length) {
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
      /^n[°o]$|^lot$|chapitre|poste/i,
    ];
    const looksHeader = (row: string[]) => row.reduce((n, c) => n + (HEADER_HINTS.some((rx) => rx.test(c)) ? 1 : 0), 0);
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rowsAcc.length, 15); i++) {
      if (looksHeader(rowsAcc[i]) >= 2) { headerIdx = i; break; }
    }
    const maxCols = rowsAcc.reduce((m, r) => Math.max(m, r.length), 0);
    const columns: string[] = headerIdx >= 0
      ? Array.from({ length: maxCols }, (_, i) => {
          const label = (rowsAcc[headerIdx][i] ?? '').trim();
          return label || `col_${i + 1}`;
        })
      : Array.from({ length: maxCols }, (_, i) => `col_${i + 1}`);

    const dataRows = headerIdx >= 0 ? rowsAcc.slice(headerIdx + 1) : rowsAcc;
    const detectedFiscal: DetectedFiscal = {};
    const parsedRows: ParsedBoqRow[] = [];
    for (const cells of dataRows) {
      const label = String(cells[0] ?? '').trim();
      if (isFiscalMetaRow(label) || /^(sous[-\s]?total\s+g[eé]n[eé]ral|total\s+ht|total\s+ttc)/i.test(label)) {
        extractFiscalFromRow(cells, detectedFiscal);
        continue;
      }
      if (isSubtotalRow(label)) continue;
      const raw: Record<string, string | number | null> = {};
      cells.forEach((c, i) => { raw[columns[i]] = c; });
      parsedRows.push({ raw });
    }
    if (headerIdx >= 0) warnings.push(`En-têtes DQE détectés ligne ${headerIdx + 1}.`);
    warnings.push(...summarizeFiscal(detectedFiscal));
    return { rows: parsedRows, columns, warnings, detectedFiscal };
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
