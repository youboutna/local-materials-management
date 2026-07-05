/**
 * PdfBoqParser — extracts BOQ rows from PDF using Y-clustering of pdfjs text items.
 * Robust replacement for the legacy split("\n") approach.
 */
import type { IDocumentParser, ParseResult, ParsedBoqRow } from './IDocumentParser';

interface PdfItem { str: string; transform: number[] }

export class PdfBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    return file.name.toLowerCase().endsWith('.pdf');
  }

  async parse(file: File): Promise<ParseResult> {
    const pdfjs = await import('pdfjs-dist');
    // @ts-ignore worker
    if (!(pdfjs as any).GlobalWorkerOptions.workerSrc) {
      // Vite friendly worker resolution
      // @ts-ignore
      (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }
    const buf = await file.arrayBuffer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (pdfjs as any).getDocument({ data: buf }).promise;

    const rowsAcc: string[][] = [];
    const warnings: string[] = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items = (content.items as PdfItem[]).filter((i) => i && i.str);
      const byY = new Map<number, PdfItem[]>();
      for (const it of items) {
        const y = Math.round(it.transform[5]);
        if (!byY.has(y)) byY.set(y, []);
        byY.get(y)!.push(it);
      }
      const ys = Array.from(byY.keys()).sort((a, b) => b - a);
      for (const y of ys) {
        const line = byY.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);
        const cols = line.map((i) => i.str.trim()).filter(Boolean);
        if (cols.length) rowsAcc.push(cols);
      }
    }

    if (!rowsAcc.length) warnings.push('Aucun texte extractible — envisager OCR.');
    const maxCols = rowsAcc.reduce((m, r) => Math.max(m, r.length), 0);
    const columns = Array.from({ length: maxCols }, (_, i) => `col_${i + 1}`);
    const rows: ParsedBoqRow[] = rowsAcc.map((cells) => {
      const raw: Record<string, string | number | null> = {};
      cells.forEach((c, i) => { raw[columns[i]] = c; });
      return { raw };
    });
    return { rows, columns, warnings };
  }
}
