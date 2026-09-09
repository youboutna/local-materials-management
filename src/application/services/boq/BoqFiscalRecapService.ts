/**
 * BoqFiscalRecapService — Scénario 5 du parser intelligent DQE : récapitulatif
 * multi-taux de TVA.
 *
 * Les lignes importées peuvent mélanger des régimes (matériel 5 %, ressources
 * humaines 16 %, exonéré 0 %). Ce service regroupe les lignes par taux et par
 * bloc fiscal afin d'alimenter l'étape « Récapitulatif » du wizard d'import et
 * le pied de page des documents générés (devis, Factur-X).
 *
 * Pure TS — aucune dépendance React ni Supabase.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface FiscalRecapGroup {
  /** Taux de TVA en base 1 (0.05 = 5 %). */
  vatRate: number;
  /** Bloc fiscal : `material` (fourniture / travaux) ou `labour` (RH). */
  block: 'material' | 'labour';
  lineCount: number;
  totalHt: number;
  vatAmount: number;
  totalTtc: number;
}

export interface FiscalRecap {
  groups: FiscalRecapGroup[];
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  /** true dès que deux taux de TVA distincts coexistent. */
  multiRate: boolean;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function lineHt(line: BoqLineDTO): number {
  const total = Number(line.totalHt ?? 0);
  if (Number.isFinite(total) && total > 0) return total;
  const qty = Number(line.quantity ?? 0);
  const pu = Number(line.unitPrice ?? 0);
  return Number.isFinite(qty * pu) ? qty * pu : 0;
}

function lineBlock(line: BoqLineDTO): 'material' | 'labour' {
  const meta = (line.metadata ?? {}) as Record<string, unknown>;
  if (meta.fiscalBlock === 'labour') return 'labour';
  return line.resourceType === 'labor' ? 'labour' : 'material';
}

export class BoqFiscalRecapService {
  /** Regroupe les lignes par (bloc, taux) et calcule HT / TVA / TTC. */
  static build(lines: BoqLineDTO[]): FiscalRecap {
    const map = new Map<string, FiscalRecapGroup>();

    for (const line of lines) {
      const ht = lineHt(line);
      if (!ht) continue;
      const rate = Number(line.vatRate ?? 0);
      const vatRate = Number.isFinite(rate) ? (rate > 1 ? rate / 100 : rate) : 0;
      const rasRate = Number(line.rasRate ?? 0);
      const normalizedRasRate = Number.isFinite(rasRate) ? (rasRate > 1 ? rasRate / 100 : rasRate) : 0;
      const block = lineBlock(line);
      const key = `${block}:${vatRate}`;
      const group =
        map.get(key) ?? { vatRate, block, lineCount: 0, totalHt: 0, vatAmount: 0, totalTtc: 0 };
      group.lineCount += 1;
      group.totalHt += ht;
      group.totalTtc += ht + ht * vatRate - ht * normalizedRasRate;
      map.set(key, group);
    }

    const groups = [...map.values()]
      .map((g) => {
        const totalHt = round2(g.totalHt);
        const vatAmount = round2(totalHt * g.vatRate);
        const totalTtc = round2(g.totalTtc);
        return { ...g, totalHt, vatAmount, totalTtc };
      })
      .sort((a, b) => (a.block === b.block ? a.vatRate - b.vatRate : a.block === 'material' ? -1 : 1));

    const totalHt = round2(groups.reduce((s, g) => s + g.totalHt, 0));
    const totalVat = round2(groups.reduce((s, g) => s + g.vatAmount, 0));
    const totalTtc = round2(groups.reduce((s, g) => s + g.totalTtc, 0));
    return {
      groups,
      totalHt,
      totalVat,
      totalTtc,
      multiRate: new Set(groups.map((g) => g.vatRate)).size > 1,
    };
  }

  /** Libellé court d'un groupe (« Matériel — TVA 5 % »). */
  static groupLabel(group: FiscalRecapGroup): string {
    const block = group.block === 'labour' ? 'Ressources humaines' : 'Matériel / travaux';
    return `${block} — TVA ${(group.vatRate * 100).toFixed(group.vatRate * 100 % 1 ? 1 : 0)} %`;
  }
}
