/**
 * Shared fiscal-line detection for BOQ parsers (Excel/CSV/PDF).
 * Detects TVA / Frais Généraux / RAS BIC / Retenues / Remises so those meta
 * lines are excluded from the imported BOQ and their rates are surfaced back
 * to the UI (auto-selection of the fiscal profile).
 */
import type { DetectedFiscal } from './IDocumentParser';

const NUM = /(-?\d[\d\s.,]*)/;

function toNumber(s: string): number | null {
  const m = s.replace(/\s+/g, '').replace(',', '.');
  const n = Number(m);
  return Number.isFinite(n) ? n : null;
}

function pctFromLabel(label: string): number | null {
  const m = label.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n / 100 : null;
}

export function isFiscalMetaRow(label: string): boolean {
  if (!label) return false;
  return /(^|\b)(t\.?v\.?a\.?|tva|frais\s+g[eé]n[eé]raux|frais\s+divers|ras\s+bic|retenue|remise|escompte|arrondi|marge|b[eé]n[eé]fice)\b/i.test(label);
}

export function isSubtotalRow(label: string): boolean {
  if (!label) return false;
  return /^(sous[-\s]?total|s\.?\s?total|total\s|grand\s*total|total\s+lot|total\s+phase|total\s+g[eé]n[eé]ral|sous[-\s]?total\s+g[eé]n[eé]ral|total\s+ht|total\s+ttc)/i.test(label);
}

/**
 * Extract fiscal metadata from a "meta" row.
 * Amount = last numeric value in the row (typically the TOTAL column).
 */
export function extractFiscalFromRow(cells: unknown[], acc: DetectedFiscal): void {
  const label = String(cells[0] ?? cells[1] ?? '').trim();
  if (!label) return;

  // last numeric cell
  let amount: number | null = null;
  for (let i = cells.length - 1; i >= 0; i--) {
    const v = cells[i];
    if (v == null || v === '') continue;
    if (typeof v === 'number' && Number.isFinite(v)) { amount = v; break; }
    if (typeof v === 'string') {
      const m = v.match(NUM);
      if (m) { const n = toNumber(m[1]); if (n != null) { amount = n; break; } }
    }
  }
  const pct = pctFromLabel(label);

  if (/t\.?v\.?a\.?|tva/i.test(label)) {
    if (pct != null) acc.vatRate = pct;
    else if (amount != null && acc.totalHt) acc.vatRate = amount / acc.totalHt;
  } else if (/frais\s+g[eé]n[eé]raux|frais\s+divers/i.test(label)) {
    if (pct != null) acc.overheadRate = pct;
    else if (amount != null && acc.totalHt) acc.overheadRate = amount / acc.totalHt;
  } else if (/ras\s+bic|retenue/i.test(label)) {
    if (pct != null) acc.withholdingRate = pct;
    else if (amount != null && acc.totalHt) acc.withholdingRate = amount / acc.totalHt;
  } else if (/total\s+ht|sous[-\s]?total\s+g[eé]n[eé]ral/i.test(label)) {
    if (amount != null) acc.totalHt = amount;
  } else if (/total\s+ttc/i.test(label)) {
    if (amount != null) acc.totalTtc = amount;
  }
}

export function summarizeFiscal(f: DetectedFiscal): string[] {
  const w: string[] = [];
  if (f.vatRate != null) w.push(`TVA détectée: ${(f.vatRate * 100).toFixed(1)}%`);
  if (f.overheadRate != null) w.push(`Frais Généraux détectés: ${(f.overheadRate * 100).toFixed(1)}%`);
  if (f.withholdingRate != null) w.push(`Retenue à la source: ${(f.withholdingRate * 100).toFixed(1)}%`);
  if (f.totalHt != null) w.push(`Total HT (source): ${f.totalHt.toLocaleString('fr-FR')}`);
  if (f.totalTtc != null) w.push(`Total TTC (source): ${f.totalTtc.toLocaleString('fr-FR')}`);
  return w;
}
