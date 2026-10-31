/**
 * MeterService — façade orchestrant Basic (BoqCalculatorService) et
 * Advanced (AdvancedMeterEngine). Point d'entrée unique pour tous les
 * calculs de métré (calculateur avancé, DQE, Tender Estimator).
 *
 * Pure TS (hexagonal) — pas de React, pas de Supabase.
 */
import { BoqCalculatorService, type BoqLineTotals } from './BoqCalculatorService';
import { computeAdvancedMeter, type AdvancedMeterResult } from './AdvancedMeterEngine';
import type { MeterInputDTO, MeterResultDTO } from '@/dtos/boq/MeterInputDTO';
import { MaterialsEstimator } from './MaterialsEstimator';
import { DEFAULT_METERING_POLICY, type MeteringPolicy } from '@/config/referentials/boq/metering-policy.referential';
import { activeDimensions, formulaLabel, unitForElementType } from '@/config/referentials/boq/formulas.referential';
import { detectElementType, getElementType, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';


export type MeterMode = 'basic' | 'advanced';

export interface MeterComputationResult {
  mode: MeterMode;
  quantity: number;
  totals: BoqLineTotals;
  advanced?: AdvancedMeterResult;
}

export interface MeterAnomaly {
  code: 'line_total_mismatch' | 'quantity_mismatch';
  message: string;
  expected: number;
  received: number;
}

export class MeterService {
  /** Determine mode from element type — `basic_calculator` = saisie rapide. */
  static resolveMode(elementType?: string | null): MeterMode {
    return elementType && getElementType(elementType as ElementTypeCode) ? 'advanced' : 'basic';
  }

  /** Unité attendue (verrouillée) pour un type d'ouvrage — référentiel. */
  static unitFor(elementType?: string | null): string | null {
    if (!elementType || elementType === 'basic_calculator' || elementType === 'generic') return null;
    return unitForElementType(elementType as ElementTypeCode);
  }

  /** Dimensions significatives (drive l'affichage L / l / h). */
  static dimensionsFor(elementType?: string | null) {
    if (!elementType || elementType === 'basic_calculator') {
      return { length: true, width: true, height: true };
    }
    return activeDimensions(elementType as ElementTypeCode);
  }

  /** Quantité géométrique temps réel + formule lisible. */
  static quantityFor(input: {
    elementType?: string | null;
    designation?: string | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    openings?: MeterInputDTO['openings'];
    deductOpenings?: boolean;
  }): { quantity: number; formula: string; unit: string | null } {
    const advanced = computeAdvancedMeter({
      designation: input.designation ?? undefined,
      elementType: (input.elementType as ElementTypeCode | null | undefined) ?? undefined,
      length: input.length,
      width: input.width,
      height: input.height,
      openings: input.openings,
      deductOpenings: input.deductOpenings,
    });
    return {
      quantity: advanced.netQuantity,
      formula: `${formulaLabel(advanced.elementType, { length: input.length, width: input.width, height: input.height })}${advanced.deducted ? ` (− ouvertures ${advanced.openingsArea.toFixed(2)})` : ''}`,
      unit: MeterService.unitFor(advanced.elementType),
    };
  }

  /**
   * Détection d'anomalies de chiffrage (non bloquante) : Qté × PU vs Total HT
   * déclaré, et quantité saisie vs quantité géométrique du métré.
   */
  static detectAnomalies(
    line: {
      designation?: string | null;
      elementType?: string | null;
      unit?: string | null;
      quantity?: number | null;
      unitPrice?: number | null;
      totalHt?: number | null;
      fees?: number | null;
      length?: number | null;
      width?: number | null;
      height?: number | null;
    },
    tolerance = DEFAULT_METERING_POLICY.relativeQuantityTolerance,
  ): MeterAnomaly[] {
    const out: MeterAnomaly[] = [];
    const qty = Number(line.quantity ?? 0);
    const pu = Number(line.unitPrice ?? 0);
    const declared = Number(line.totalHt ?? 0);
    if (qty > 0 && pu > 0 && declared > 0) {
      const expected = qty * pu + Number(line.fees ?? 0);
      if (Math.abs(expected - declared) > DEFAULT_METERING_POLICY.absolutePriceTolerance) {
        out.push({
          code: 'line_total_mismatch',
          message: `⚠ Montant incohérent : Qté × PU = ${expected.toLocaleString('fr-FR')} vs Total HT déclaré ${declared.toLocaleString('fr-FR')}`,
          expected,
          received: declared,
        });
      }
    }
    const geo = MeterService.quantityFor(line).quantity;
    if (geo > 0 && qty > 0 && Math.abs(geo - qty) > Math.max(0.01, geo * tolerance)) {
      out.push({
        code: 'quantity_mismatch',
        message: `⚠ Quantité incohérente : métré attendu ${Number(geo.toFixed(2)).toLocaleString('fr-FR')}, reçu ${qty.toLocaleString('fr-FR')}`,
        expected: geo,
        received: qty,
      });
    }
    return out;
  }


  /** Single line computation — routes to Basic or Advanced engine. */
  static compute(input: MeterInputDTO): MeterComputationResult {
    const elementType = input.elementType ?? detectElementType(input.designation);
    const mode = MeterService.resolveMode(elementType);
    if (mode === 'advanced') {
      const advanced = computeAdvancedMeter({
        designation: input.designation,
        elementType,
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
    return MeterService.enrich(dtos);
  }

  /** Same engine for every source; explicit imported quantities remain authoritative. */
  static enrich(dtos: readonly MeterInputDTO[], policy: MeteringPolicy = DEFAULT_METERING_POLICY): MeterInputDTO[] {
    return dtos.map((input) => {
      const elementType = input.elementType ?? detectElementType(input.designation);
      const advanced = computeAdvancedMeter({ ...input, elementType });
      const geometric = input.provenance?.format === 'calculator' || input.provenance?.format === 'plan' || input.quantity <= 0;
      const quantity = geometric && MeterService.resolveMode(elementType) === 'advanced'
        ? advanced.netQuantity : BoqCalculatorService.computeQuantity(input);
      const result: MeterResultDTO = {
        grossQuantity: geometric ? advanced.grossQuantity : quantity,
        openingsArea: geometric ? advanced.openingsArea : 0,
        netQuantity: quantity, deducted: geometric && advanced.deducted,
        formula: geometric ? advanced.formula : String(quantity),
        materials: MaterialsEstimator.estimate(advanced.elementType, quantity, policy),
        policyCode: policy.code, policyVersion: policy.version,
      };
      return { ...input, quantity, metadata: { ...input.metadata, metering: result,
        ...(input.provenance ? { provenance: input.provenance } : {}) } };
    });
  }

  static summary(line: MeterInputDTO, policy: MeteringPolicy = DEFAULT_METERING_POLICY): MeterResultDTO {
    const advanced = computeAdvancedMeter(line);
    const quantity = line.quantity;
    const count = typeof line.metadata?.planElementCount === 'number' ? line.metadata.planElementCount : 1;
    const hasGeometry = advanced.grossQuantity > 0;
    return {
      grossQuantity: hasGeometry ? advanced.grossQuantity * count : quantity,
      openingsArea: hasGeometry ? advanced.openingsArea * count : 0,
      netQuantity: quantity,
      deducted: hasGeometry && advanced.deducted,
      formula: hasGeometry ? `${advanced.formula}${count !== 1 ? ` × ${count}` : ''}` : String(quantity),
      materials: MaterialsEstimator.estimate(advanced.elementType, quantity, policy),
      policyCode: policy.code, policyVersion: policy.version,
    };
  }
}
