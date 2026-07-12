/**
 * AdvancedMeterEngine — moteur unifié consommé à la fois par la saisie
 * manuelle (AdvancedQuantityCalculator) et par le parser DQE.
 *
 * Rôle : appliquer la formule dimensionnelle du référentiel + déduction
 * automatique des ouvertures (mur / cloison / peinture) et exposer un
 * résultat structuré (surface brute, surface d'ouvertures, quantité nette).
 */
import { computeQuantityByElementType } from '@/config/referentials/boq/formulas.referential';
import { getElementType, detectElementType, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';
import type { MeterInputDTO, MeterOpening } from '@/dtos/boq/MeterInputDTO';

export type OpeningUnit = 'm' | 'cm' | 'mm';

const FACTOR: Record<OpeningUnit, number> = { m: 1, cm: 0.01, mm: 0.001 };

/** Convertit une valeur brute (avec unité optionnelle) en mètres. */
export function toMeters(value: number, unit: OpeningUnit = 'm'): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value * FACTOR[unit];
}

/** Normalise une ouverture depuis n'importe quelle unité vers des mètres. */
export function normalizeOpening(o: { width: number; height: number; count?: number; unit?: OpeningUnit; label?: string }): MeterOpening {
  const u = o.unit ?? 'm';
  return {
    width: toMeters(o.width, u),
    height: toMeters(o.height, u),
    count: o.count && o.count > 0 ? Math.round(o.count) : 1,
    label: o.label,
  };
}

export interface AdvancedMeterResult {
  elementType: ElementTypeCode;
  grossQuantity: number;
  openingsArea: number;
  netQuantity: number;
  deducted: boolean;
  formula: string;
}

/** Applique la formule du référentiel + déduction ouvertures si pertinente. */
export function computeAdvancedMeter(input: {
  designation?: string;
  elementType?: ElementTypeCode | string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  openings?: MeterOpening[];
  deductOpenings?: boolean;
}): AdvancedMeterResult {
  const code: ElementTypeCode =
    (input.elementType as ElementTypeCode) ||
    detectElementType(input.designation ?? '');
  const def = getElementType(code);
  const gross = computeQuantityByElementType(code, {
    length: input.length,
    width: input.width,
    height: input.height,
  });
  const openings = input.openings ?? [];
  const openingsArea = openings.reduce(
    (sum, o) => sum + (o.width || 0) * (o.height || 0) * (o.count && o.count > 0 ? o.count : 1),
    0,
  );
  const deducted = input.deductOpenings ?? def?.deductOpenings ?? false;
  const net = deducted ? Math.max(0, gross - openingsArea) : gross;
  const formula = deducted
    ? `${gross.toFixed(3)} − Σ(ouvertures) ${openingsArea.toFixed(3)} = ${net.toFixed(3)}`
    : `${gross.toFixed(3)}`;
  return { elementType: code, grossQuantity: gross, openingsArea, netQuantity: net, deducted, formula };
}

/** Applique le moteur à un DTO parsé et renvoie la quantité nette (utilisé par l'orchestrator). */
export function applyAdvancedMeter(dto: MeterInputDTO): number {
  const r = computeAdvancedMeter({
    designation: dto.designation,
    elementType: dto.elementType,
    length: dto.length,
    width: dto.width,
    height: dto.height,
    openings: dto.openings,
    deductOpenings: dto.deductOpenings,
  });
  return r.netQuantity || dto.quantity || 0;
}
