/**
 * DevisGenerator — agrège des BoqLineDTO par WBS (phase / jalon / tâche)
 * et produit un devis normalisé + export CSV. Réutilisé par DQE, Tender
 * Estimator et Portail Fournisseur.
 *
 * Pure TS — pas de React, pas de Supabase, pas d'IO fichier direct.
 */
import { BoqCalculatorService, type BoqLineTotals } from './BoqCalculatorService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface DevisSection {
  key: string;
  label: string;
  lines: BoqLineDTO[];
  totals: BoqLineTotals;
}

export interface DevisDocument {
  sections: DevisSection[];
  totals: BoqLineTotals;
  generatedAt: string;
}

export type WbsKey = 'phaseId' | 'milestoneId' | 'taskId';

export class DevisGenerator {
  /** Group lines by a WBS key. Rows with a null key fall in an "Autre" bucket. */
  static aggregate(lines: BoqLineDTO[], groupBy: WbsKey = 'phaseId'): DevisDocument {
    const bucket = new Map<string, { label: string; lines: BoqLineDTO[] }>();
    for (const l of lines) {
      const k = (l[groupBy] as string | null | undefined) ?? '__none__';
      const label = k === '__none__' ? 'Autre' : String(k);
      const cur = bucket.get(k) ?? { label, lines: [] };
      cur.lines.push(l);
      bucket.set(k, cur);
    }
    const sections: DevisSection[] = Array.from(bucket.entries()).map(([k, v]) => ({
      key: k,
      label: v.label,
      lines: v.lines,
      totals: BoqCalculatorService.aggregate(v.lines),
    }));
    const totals = BoqCalculatorService.aggregate(lines);
    return { sections, totals, generatedAt: new Date().toISOString() };
  }

  /** CSV (RFC 4180-ish; comma sep) — safe for Excel FR when reopened as UTF-8. */
  static toCsv(doc: DevisDocument): string {
    const header = [
      'section', 'designation', 'unite', 'quantite', 'pu_ht', 'tva', 'total_ht', 'total_ttc',
    ].join(',');
    const rows: string[] = [header];
    for (const s of doc.sections) {
      for (const l of s.lines) {
        const t = BoqCalculatorService.computeTotals(l);
        rows.push([
          csv(s.label),
          csv(l.designation ?? ''),
          csv(l.unit ?? ''),
          num(t.quantity),
          num(l.unitPrice ?? 0),
          num(l.vatRate ?? 0),
          num(t.totalHt),
          num(t.totalTtc),
        ].join(','));
      }
    }
    rows.push(['', 'TOTAL', '', '', '', '', num(doc.totals.totalHt), num(doc.totals.totalTtc)].join(','));
    return rows.join('\n');
  }
}

function csv(s: string): string {
  const needs = /[",\n]/.test(s);
  const cleaned = s.replace(/"/g, '""');
  return needs ? `"${cleaned}"` : cleaned;
}
function num(n: number): string { return (Number.isFinite(n) ? n : 0).toFixed(2); }
