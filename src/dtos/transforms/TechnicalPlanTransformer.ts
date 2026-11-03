import type { TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';

export class TechnicalPlanTransformer {
  static updateDimension(element: TechnicalPlanElementDTO, field: 'length' | 'width' | 'height', raw: string): TechnicalPlanElementDTO {
    const value = raw.trim() ? Number(raw.replace(',', '.')) : undefined;
    return { ...element, [field]: value, confirmed: false };
  }
}