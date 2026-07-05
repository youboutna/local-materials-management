/**
 * BOQ Validator — pure domain service producing UI-friendly field-scoped errors.
 * Shared by QuantityTakeoff form, Tender Estimator form, DQE Import wizard.
 */

import { BOQ_UNIT_BY_CODE, BoqUnit, isBoqUnit } from '@/config/referentials/boq/units.referential';

export interface BoqValidationInput {
  materialId?: string | null;
  elementType?: string | null;
  unit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unitPrice?: number | null;
}

export interface BoqFieldError {
  field:
    | 'materialId'
    | 'elementType'
    | 'unit'
    | 'length'
    | 'width'
    | 'height'
    | 'unitPrice';
  message: string;
}

export interface BoqValidationResult {
  ok: boolean;
  errors: BoqFieldError[];
  /** Aggregated single-line message for toast fallback. */
  message: string;
}

export class BoqValidatorService {
  static validate(input: BoqValidationInput): BoqValidationResult {
    const errors: BoqFieldError[] = [];

    if (!input.materialId) {
      errors.push({ field: 'materialId', message: 'Sélectionnez un matériau.' });
    }
    if (!input.elementType || !input.elementType.trim()) {
      errors.push({ field: 'elementType', message: 'Type d’élément requis (ex : Mur, Dalle).' });
    }
    if (!input.unit || !isBoqUnit(input.unit)) {
      errors.push({ field: 'unit', message: 'Unité invalide.' });
    } else {
      const def = BOQ_UNIT_BY_CODE[input.unit as BoqUnit];
      if (def.requires.length && !(Number(input.length) > 0)) {
        errors.push({ field: 'length', message: 'Longueur > 0 requise.' });
      }
      if (def.requires.width && !(Number(input.width) > 0)) {
        errors.push({ field: 'width', message: `Largeur > 0 requise pour ${def.code}.` });
      }
      if (def.requires.height && !(Number(input.height) > 0)) {
        errors.push({ field: 'height', message: `Hauteur > 0 requise pour ${def.code}.` });
      }
    }
    if (input.unitPrice != null && Number(input.unitPrice) < 0) {
      errors.push({ field: 'unitPrice', message: 'PU ne peut pas être négatif.' });
    }

    return {
      ok: errors.length === 0,
      errors,
      message: errors.map((e) => e.message).join(' • ') || 'OK',
    };
  }
}
