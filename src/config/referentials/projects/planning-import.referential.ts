import type { PlanningTextMappingDTO } from '@/dtos/entities/PlanningPreviewDTO';
import type { PlanningWorkbookMappingDTO } from '@/dtos/entities/PlanningWorkbookDTO';
/** Column preset only; monetary scale must be explicitly reviewed by the operator. */
export const DEFAULT_WORKBOOK_MAPPING: PlanningWorkbookMappingDTO = {
  codeColumn: 0, titleColumn: 1, responsibleColumn: 2, associatesColumn: 3,
  unitColumn: 4, quantityColumn: 5, unitPriceColumn: 6, amountColumn: 7,
  amountMultiplier: 1, codePattern: '^\\d+(?:[.\\-]\\d+)+[.\\-]?$',
  totalPattern: '^(?:total|sous[- ]?total|grand total)\\b',
};
/** Import vocabulary is configurable; this is only a French table mapping preset. */
export const DEFAULT_PLANNING_MAPPING: PlanningTextMappingDTO = {
  delimiter:'\t',phaseColumn:0,missionsColumn:1,scheduleColumn:2,deliverableColumn:3,
  weekPattern:'Semaines?\\s*(\\d+)(?:\\s*[-–à]\\s*(\\d+))?',
  postDeliveryPattern:'J\\+(\\d+)\\s*(?:à|[-–])\\s*J\\+(\\d+)',
  milestonePattern:'S(\\d+)',daysPerWeek:7,
};