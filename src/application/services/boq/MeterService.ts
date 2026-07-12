/**
 * MeterService — façade orchestrant Basic (BoqCalculatorService) et
 * Advanced (AdvancedMeterEngine). Point d'entrée unique pour tous les
 * calculs de métré (calculateur avancé, DQE, Tender Estimator).
 *
 * Pure TS (hexagonal) — pas de React, pas de Supabase.
 */
import { BoqCalculatorService, type BoqLineTotals } from './BoqCalculatorService';
import { computeAdvancedMeter, applyAdvancedMeter, type AdvancedMeterResult } from './AdvancedMeterEngine';
import type { MeterInputDTO } from '@/dtos/boq/MeterInputDTO';
import type { ElementTypeCode } from '@/config/referentials/boq/element-types.referential';

export type MeterMode = 'basic' | 'advanced';

export interface MeterComputationResult {
  mode: MeterMode;
  quantity: number;
  totals: BoqLineTotals;
  advanced?: AdvancedMeterResult;
}

export class MeterService {
  /** Determine mode from element type — `basic_calculator` = saisie rapide. */
  static resolveMode(elementType?: string | null): MeterMode {
    if (!elementType || elementType === 'basic_calculator') return 'basic';
    return 'advanced';
  }

  /** Single line computation — routes to Basic or Advanced engine. */
  static compute(input: MeterInputDTO): MeterComputationResult {
    const mode = MeterService.resolveMode(input.elementType);
    if (mode === 'advanced') {
      const advanced = computeAdvancedMeter({
        designation: input.designation,
        elementType: input.elementType as ElementTypeCode | null | undefined,
        length: input.length,
        width: input.width,
        height: input.height,
        openings: input.openings,
        deductOpenings: input.deductOpenings,
      });
      const totals = BoqCalculatorService.computeTotals({
        ...input,
        quantity: advanced.netQuantity,
      });
      return { mode, quantity: advanced.netQuantity, totals, advanced };
    }
    const totals = BoqCalculatorService.computeTotals(input);
    return { mode, quantity: totals.quantity, totals };
  }

  /** Batch normalization of parsed DTOs — used by UnifiedBoqParser. */
  static normalize(dtos: MeterInputDTO[]): MeterInputDTO[] {
    return dtos.map((d) => {
      const mode = MeterService.resolveMode(d.elementType);
      if (mode === 'advanced') {
        return { ...d, quantity: applyAdvancedMeter(d) };
      }
      return { ...d, quantity: BoqCalculatorService.computeQuantity(d) };
    });
  }
}
