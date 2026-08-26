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
import type { IDocumentParser, ParseResult, ParsedBoqRow, DetectedFiscal } from './IDocumentParser';
import { extractFiscalFromRow, isFiscalMetaRow, isSubtotalRow, summarizeFiscal } from './fiscalDetection';
import { extractDocumentParties, type DocumentParty } from './headerDetection';
import { extractDocumentMeta, mergeParties, type DocumentMeta } from './documentMetaDetection';

import {
  detectSection,
  isRepeatedHeaderRow,
  SECTION_LABEL_COLUMN,
  SECTION_KIND_COLUMN,
  SECTION_PHASE_COLUMN,
  SECTION_LOT_COLUMN,
  type DetectedSection,
} from './sectionDetection';

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
    if (!wb.SheetNames.length) return { rows: [], columns: [], warnings: ['Classeur vide.'] };

    // Passe 1 — lecture de toutes les feuilles : métadonnées documentaires
    // (Résumé & En-tête, Conditions…) puis sélection de la feuille de postes.
    const sheets = wb.SheetNames.map((name) => ({
      name,
      matrix: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null }) as unknown[][],
    })).filter((s) => s.matrix.length > 0);
    if (!sheets.length) return { rows: [], columns: [], warnings: ['Feuille vide.'] };

    let meta: DocumentMeta = {};
    let metaParties: { supplier: DocumentParty; organization: DocumentParty } = { supplier: {}, organization: {} };
    for (const s of sheets) {
      const res = extractDocumentMeta(s.matrix as (string | number | null)[][], meta, metaParties);
      meta = res.meta;
      metaParties = res.parties;
    }

    // Feuille de postes = meilleur score d'en-tête tabulaire.
    const scored = sheets.map((s) => {
      let headerIdx = 0;
      let bestHits = 0;
      const scanLimit = Math.min(s.matrix.length, 15);
      for (let i = 0; i < scanLimit; i++) {
        const hits = looksLikeHeaderRow(s.matrix[i] ?? []);
        if (hits > bestHits) { bestHits = hits; headerIdx = i; }
        if (hits >= 3) break;
      }
      return { ...s, headerIdx, bestHits };
    }).sort((a, b) => b.bestHits - a.bestHits);

    const target = scored[0];
    const matrix = target.matrix;
    let headerIdx = target.headerIdx;
    const bestHits = target.bestHits;

    const warnings: string[] = [];
    if (sheets.length > 1) {
      warnings.push(`Classeur multi-feuilles : postes lus dans « ${target.name} ».`);
    }
    if (bestHits < 2) {
      warnings.push('En-têtes non détectés — utilisation de la 1ʳᵉ ligne comme colonnes.');
      headerIdx = 0;
    }

    const rawHeader = matrix[headerIdx] ?? [];
    const baseColumns: string[] = rawHeader.map((c, i) => {
      const s = c == null ? '' : String(c).trim();
      return s || `col_${i + 1}`;
    });
    const columns = [...baseColumns, SECTION_LOT_COLUMN, SECTION_LABEL_COLUMN, SECTION_KIND_COLUMN, SECTION_PHASE_COLUMN];

    // En-tête administratif (client / prestataire) : balayage du document entier
    // car dans les devis Excel l'émetteur figure souvent en pied de page.
    const textMatrix: string[][] = matrix.map((line) => (line ?? []).map((c) => (c == null ? '' : String(c))));
    const parties = mergeParties(extractDocumentParties(textMatrix, headerIdx), metaParties);


    const rows: ParsedBoqRow[] = [];
    const detectedFiscal: DetectedFiscal = {};
    let section: DetectedSection | null = null;
    let sectionsFound = 0;
    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const line = matrix[i] ?? [];
      if (line.every((v) => v == null || String(v).trim() === '')) continue;
      const label = String(line[0] ?? line[1] ?? '').trim();
      // Fiscal meta rows: extract rates then drop
      if (isFiscalMetaRow(label) || /^(sous[-\s]?total\s+g[eé]n[eé]ral|total\s+ht|total\s+ttc)/i.test(label)) {
        extractFiscalFromRow(line, detectedFiscal);
        continue;
      }
      if (isSubtotalRow(label)) continue;
      const hasNumeric = line.some((v) => typeof v === 'number' && v !== 0);
      const nextSection = detectSection(line as (string | number | null)[]);
      if (nextSection && !hasNumeric) { section = nextSection; sectionsFound += 1; continue; }
      if (nextSection) section = nextSection;
      if (isRepeatedHeaderRow(line as (string | number | null)[], baseColumns)) continue;

      const raw: Record<string, string | number | null> = {};
      baseColumns.forEach((col, idx) => {
        const v = line[idx];
        raw[col] = v == null ? null : typeof v === 'number' ? v : String(v);
      });
      raw[SECTION_LOT_COLUMN] = section?.lot ?? null;
      raw[SECTION_LABEL_COLUMN] = section?.label ?? null;
      raw[SECTION_KIND_COLUMN] = section?.kind ?? null;
      raw[SECTION_PHASE_COLUMN] = section?.phase ?? null;
      rows.push({ raw });
    }

    if (sectionsFound) warnings.push(`${sectionsFound} lot(s) détecté(s) depuis les lignes de section.`);
    warnings.push(...summarizeFiscal(detectedFiscal));
    return { rows, columns, warnings, detectedFiscal, parties };
  }
}
