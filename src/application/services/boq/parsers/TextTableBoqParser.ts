/**
 * TextTableBoqParser — tableaux DQE en HTML ou en texte brut (copier-coller).
 *
 * Complète les parseurs PDF / tableur pour les formats du scénario « formats
 * d'entrée » : `<table>` HTML, TSV, texte aligné par tabulations, points-virgules
 * ou séries d'espaces. Le pipeline métier est identique aux autres parseurs :
 * enveloppe documentaire lue comme contexte, recomposition des lignes logiques
 * (R1–R5), lignes fiscales extraites puis retirées.
 */
import type { DetectedFiscal, IDocumentParser, ParseResult, ParsedBoqRow } from './IDocumentParser';
import { extractFiscalFromRow, isFiscalMetaRow, isSubtotalRow, summarizeFiscal } from './fiscalDetection';
import { extractDocumentParties } from './headerDetection';
import { extractEnvelope, isEnvelopeRow, summarizeEnvelope } from './envelopeDetection';
import { assembleLogicalRows } from './rowAssembly';
import { segmentDocumentBlocks } from './documentBlocks';
import {
  detectSection,
  isRepeatedHeaderRow,
  SECTION_KIND_COLUMN,
  SECTION_LABEL_COLUMN,
  SECTION_LOT_COLUMN,
  SECTION_PHASE_COLUMN,
  type DetectedSection,
} from './sectionDetection';

const HEADER_HINTS: RegExp[] = [
  /d[eé]signation|libell[eé]|description|intitul/i,
  /^unit[eé]?$|^u\.?$|^um$/i,
  /qu?antit[eé]|^qt[eé]?$|^qty$/i,
  /prix.*unit|^p\.?\s*u\.?|^pu$/i,
  /montant|^total|prix.*total/i,
  /poste|cat[eé]gorie|chapitre|^lot$|^n[°o]$/i,
];

const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

/** Extrait la première table HTML significative sous forme de matrice. */
export function parseHtmlTable(html: string): string[][] {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  let best: string[][] = [];
  for (const table of tables) {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
    const matrix = rows.map((row) =>
      [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) =>
        decodeEntities(c[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
      ),
    );
    if (matrix.length > best.length) best = matrix;
  }
  return best;
}

/** Découpe un texte brut collé en matrice (tabulations, `;`, `|` ou 2+ espaces). */
export function parseDelimitedText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !/^[-=_\s|+]+$/.test(l.trim()));
  const pick = (line: string): string[] => {
    if (line.includes('\t')) return line.split('\t');
    if (line.includes(';')) return line.split(';');
    if ((line.match(/\|/g)?.length ?? 0) >= 2) return line.replace(/^\||\|$/g, '').split('|');
    return line.split(/\s{2,}/);
  };
  return lines.map((l) => pick(l).map((c) => c.trim()));
}

export class TextTableBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    const n = file.name.toLowerCase();
    return n.endsWith('.html') || n.endsWith('.htm') || n.endsWith('.txt') || n.endsWith('.tsv');
  }

  async parse(file: File): Promise<ParseResult> {
    const text = await file.text();
    const isHtml = /<table[\s>]/i.test(text);
    const matrix = repairOcrMatrix(
      (isHtml ? parseHtmlTable(text) : parseDelimitedText(text)).filter((r) =>
        r.some((c) => String(c ?? '').trim()),
      ),
    );

    if (!matrix.length) return { rows: [], columns: [], warnings: ['Aucun tableau détecté dans le document.'] };

    const warnings: string[] = [];
    let headerIdx = 0;
    let bestHits = 0;
    for (let i = 0; i < Math.min(matrix.length, 15); i++) {
      const hits = (matrix[i] ?? []).filter((c) => c && HEADER_HINTS.some((rx) => rx.test(c))).length;
      if (hits > bestHits) { bestHits = hits; headerIdx = i; }
      if (hits >= 3) break;
    }
    if (bestHits < 2) {
      const { tableStart, headerRows } = segmentDocumentBlocks(matrix, { headerIdx: -1 });
      headerIdx = Math.max(0, tableStart - 1);
      warnings.push('En-têtes non détectés — colonnes déduites du début du tableau.');
      if (headerRows.length) {
        warnings.push(`${headerRows.length} ligne(s) d'en-tête documentaire lues comme métadonnées (hors lignes DQE).`);
      }
    }

    const baseColumns = (matrix[headerIdx] ?? []).map((c, i) => c.trim() || `col_${i + 1}`);
    const columns = [...baseColumns, SECTION_LOT_COLUMN, SECTION_LABEL_COLUMN, SECTION_KIND_COLUMN, SECTION_PHASE_COLUMN];

    const parties = extractDocumentParties(matrix, headerIdx);
    const { envelope } = extractEnvelope(matrix);
    if (!envelope.emitter.name && parties.supplier?.name) envelope.emitter = { ...parties.supplier };
    if (!envelope.receiver.name && parties.organization?.name) envelope.receiver = { ...parties.organization };
    warnings.push(...summarizeEnvelope(envelope));

    const designationIdx = Math.max(0, baseColumns.findIndex((c) => /d[eé]signation|libell|description|intitul/i.test(c)));
    const numericIdx = baseColumns
      .map((c, i) => (/qu?antit|^qt|prix|^p\.?\s*u|montant|^total|tva|^unit/i.test(c) ? i : -1))
      .filter((i) => i >= 0);
    const absorbed = assembleLogicalRows(matrix, {
      headerIdx,
      designationIdx,
      numericIdx,
      consumed: new Set<number>(),
      isBoundary: (cells) => !!detectSection(cells) || isRepeatedHeaderRow(cells, baseColumns),
    });
    if (absorbed) warnings.push(`${absorbed} ligne(s) de continuation fusionnée(s) avec leur ligne d'origine.`);

    const rows: ParsedBoqRow[] = [];
    const detectedFiscal: DetectedFiscal = {};
    let section: DetectedSection | null = null;
    let sectionsFound = 0;

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const cells = matrix[i] ?? [];
      if (!cells.some((c) => String(c ?? '').trim())) continue;
      const label = String(cells.find((c) => String(c ?? '').trim()) ?? '').trim();

      const nextSection = detectSection(cells);
      if (nextSection) { section = nextSection; sectionsFound += 1; continue; }
      if (isRepeatedHeaderRow(cells, baseColumns)) continue;
      if (isFiscalMetaRow(label) || /^(sous[-\s]?total\s+g[eé]n[eé]ral|total\s+ht|total\s+ttc)/i.test(label)) {
        extractFiscalFromRow(cells, detectedFiscal);
        continue;
      }
      if (isSubtotalRow(label)) continue;
      if (isEnvelopeRow(cells)) continue;

      const raw: Record<string, string | number | null> = {};
      cells.forEach((c, idx) => { raw[baseColumns[idx] ?? `col_${idx + 1}`] = c; });
      raw[SECTION_LOT_COLUMN] = section?.lot ?? null;
      raw[SECTION_LABEL_COLUMN] = section?.label ?? null;
      raw[SECTION_KIND_COLUMN] = section?.kind ?? 'material';
      rows.push({ raw });
    }

    if (sectionsFound) warnings.push(`${sectionsFound} lot(s) détecté(s) depuis les lignes de section.`);
    warnings.push(...summarizeFiscal(detectedFiscal));
    return { rows, columns, warnings, detectedFiscal, parties, envelope };
  }
}
