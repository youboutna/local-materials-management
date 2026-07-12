/**
 * SpreadsheetBoqParser — xlsx/xls/csv → ParsedBoqRow[].
 *
 * Uses a two-pass strategy so real-world DQE files (with a document header,
 * merged cells, sub-title rows, cf. captures « DEVIS QUANTITATIF ESTIMATIF »)
 * parse cleanly:
 *   1. Read the sheet as a raw matrix (header:1).
 *   2. Detect the true header row by scanning the first ~15 rows for at least
 *      2 known BOQ header keywords (Désignation, Unité, Quantité, PU, Montant…).
 *   3. Emit columns as the detected header labels; ignore rows above.
 */
import * as XLSX from 'xlsx';
import type { IDocumentParser, ParseResult, ParsedBoqRow } from './IDocumentParser';

const HEADER_HINTS: RegExp[] = [
  /d[eé]signation|libell[eé]|description|intitul/i,
  /^unit[eé]?$|^u\.?$|^um$/i,
  /qu?antit[eé]|^qt[eé]?$|^qty$/i,
  /prix.*unit|^p\.?\s*u\.?$|^pu$/i,
  /montant|^total$|prix.*total/i,
  /poste|cat[eé]gorie|chapitre|^lot$|^n[°o]$/i,
];

function looksLikeHeaderRow(row: unknown[]): number {
  let hits = 0;
  for (const cell of row) {
    if (cell == null) continue;
    const s = String(cell).trim();
    if (!s) continue;
    if (HEADER_HINTS.some((rx) => rx.test(s))) hits += 1;
  }
  return hits;
}

export class SpreadsheetBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    const n = file.name.toLowerCase();
    return n.endsWith('.xlsx') || n.endsWith('.xls') || n.endsWith('.csv');
  }

  async parse(file: File): Promise<ParseResult> {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const first = wb.SheetNames[0];
    if (!first) return { rows: [], columns: [], warnings: ['Classeur vide.'] };
    const sheet = wb.Sheets[first];
    const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    if (!matrix.length) return { rows: [], columns: [], warnings: ['Feuille vide.'] };

    // Detect header row: first row within top 15 with ≥2 known hints.
    let headerIdx = 0;
    let bestHits = 0;
    const scanLimit = Math.min(matrix.length, 15);
    for (let i = 0; i < scanLimit; i++) {
      const hits = looksLikeHeaderRow(matrix[i] ?? []);
      if (hits > bestHits) { bestHits = hits; headerIdx = i; }
      if (hits >= 3) break;
    }

    const warnings: string[] = [];
    if (bestHits < 2) {
      warnings.push('En-têtes non détectés — utilisation de la 1ʳᵉ ligne comme colonnes.');
      headerIdx = 0;
    }

    const rawHeader = matrix[headerIdx] ?? [];
    const columns: string[] = rawHeader.map((c, i) => {
      const s = c == null ? '' : String(c).trim();
      return s || `col_${i + 1}`;
    });

    const rows: ParsedBoqRow[] = [];
    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const line = matrix[i] ?? [];
      // Skip fully empty rows
      if (line.every((v) => v == null || String(v).trim() === '')) continue;
      // Skip sub-total / total / section-header rows even when text is in col B/C
      const joined = line.map((v) => String(v ?? '').trim()).join(' | ').toLowerCase();
      if (/(^|\|\s*)(sous[-\s]?total|s\.?\s?total|total\s|grand\s*total|total\s+lot|total\s+phase|total\s+g[eé]n[eé]ral)/i.test(joined)) continue;
      // Skip pure section headers ("LOT 1 - PHASE 2 : ...") that carry no quantity + no price
      const hasNumeric = line.some((v) => typeof v === 'number' && v !== 0);
      if (!hasNumeric && /^(lot\s*\d|phase\s*\d|chapitre|section)/i.test(String(line[1] ?? line[0] ?? '').trim())) continue;

      const raw: Record<string, string | number | null> = {};
      columns.forEach((col, idx) => {
        const v = line[idx];
        raw[col] = v == null ? null : typeof v === 'number' ? v : String(v);
      });
      rows.push({ raw });
    }

    return { rows, columns, warnings };
  }
}
