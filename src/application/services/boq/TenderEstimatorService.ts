/**
 * TenderEstimatorService — orchestrates tender DQE estimation on top of the
 * BOQ kernel. Pure application service (no React, no Supabase imports at top).
 *
 * Responsibilities:
 *   - Compose category (material / labour / equipment) selection with the
 *     BoqCalculatorService to produce live HT / TVA / TTC previews.
 *   - Persist the final "devis" via the shared BOQ repository using
 *     source='tender_estimate' so downstream comparison / analytics work
 *     unchanged.
 */
import { BoqCalculatorService, type BoqLineTotals } from './BoqCalculatorService';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqResourceType } from '@/domain/boq/BoqLine';

export type TenderCategory = 'material' | 'labour' | 'equipment' | 'overhead';

export interface TenderEstimatorLineInput {
  designation: string;
  category: TenderCategory;
  resourceType?: BoqResourceType;
  unit: string;
  quantity?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unitPrice?: number | null;
  vatRate?: number | null; // 0.20 = 20%
  materialId?: string | null;
  phaseId?: string | null;
  milestoneId?: string | null;
  taskId?: string | null;
}

export interface TenderEstimatorSummary {
  totals: BoqLineTotals;
  byCategory: Record<TenderCategory, BoqLineTotals>;
  lineCount: number;
}

const EMPTY: BoqLineTotals = { quantity: 0, totalHt: 0, totalTva: 0, totalTtc: 0 };

function resolveResourceType(cat: TenderCategory): BoqResourceType {
  if (cat === 'labour') return 'labor';
  if (cat === 'equipment') return 'equipment';
  return 'material';
}

export class TenderEstimatorService {
  /** Live preview totals — pure, use in components without a network round trip. */
  static summarize(lines: TenderEstimatorLineInput[]): TenderEstimatorSummary {
    const byCategory: Record<TenderCategory, BoqLineTotals> = {
      material: { ...EMPTY },
      labour: { ...EMPTY },
      equipment: { ...EMPTY },
      overhead: { ...EMPTY },
    };
    for (const l of lines) {
      const t = BoqCalculatorService.computeTotals(l);
      const bucket = byCategory[l.category] ?? byCategory.material;
      byCategory[l.category] = {
        quantity: bucket.quantity + t.quantity,
        totalHt: bucket.totalHt + t.totalHt,
        totalTva: bucket.totalTva + t.totalTva,
        totalTtc: bucket.totalTtc + t.totalTtc,
      };
    }
    const totals = BoqCalculatorService.aggregate(lines);
    return { totals, byCategory, lineCount: lines.length };
  }

  /** Convert estimator lines into the canonical BoqLineDTO shape. */
  static toBoqLines(
    lines: TenderEstimatorLineInput[],
    ctx: { tenderId: string; projectId?: string; submittedBy?: string | null },
  ): BoqLineDTO[] {
    return lines
      .filter((l) => (l.designation || '').trim().length > 0)
      .map<BoqLineDTO>((l) => {
        const t = BoqCalculatorService.computeTotals(l);
        return {
          source: 'tender_estimate',
          contextId: ctx.tenderId,
          designation: l.designation.trim(),
          unit: l.unit,
          quantity: t.quantity,
          length: l.length ?? null,
          width: l.width ?? null,
          height: l.height ?? null,
          unitPrice: l.unitPrice ?? null,
          vatRate: l.vatRate ?? null,
          totalHt: t.totalHt,
          materialId: l.materialId ?? null,
          phaseId: l.phaseId ?? null,
          milestoneId: l.milestoneId ?? null,
          taskId: l.taskId ?? null,
          resourceType: l.resourceType ?? resolveResourceType(l.category),
          submittedBy: ctx.submittedBy ?? null,
        };
      });
  }

  /** Commit the current estimate — returns the persisted BoqLineDTO[]. */
  static async commit(
    lines: TenderEstimatorLineInput[],
    ctx: { tenderId: string; projectId?: string; submittedBy?: string | null },
  ): Promise<BoqLineDTO[]> {
    const dtos = TenderEstimatorService.toBoqLines(lines, ctx);
    if (!dtos.length) return [];
    return boqRepository.bulkCreate(dtos);
  }
}
