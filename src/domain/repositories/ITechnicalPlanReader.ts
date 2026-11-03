import type { TechnicalPlanPageDTO } from '@/dtos/boq/TechnicalPlanDTO';

/** Technical extraction only; no interpretation or business calculation. */
export interface ITechnicalPlanReader {
  read(file: File): Promise<TechnicalPlanPageDTO[]>;
}