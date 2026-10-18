import type { PlanningTextMappingDTO } from '@/dtos/entities/PlanningPreviewDTO';
/** Import vocabulary is configurable; this is only a French table mapping preset. */
export const DEFAULT_PLANNING_MAPPING: PlanningTextMappingDTO = {
  delimiter:'\t',phaseColumn:0,missionsColumn:1,scheduleColumn:2,deliverableColumn:3,
  weekPattern:'Semaines?\\s*(\\d+)(?:\\s*[-–à]\\s*(\\d+))?',
  postDeliveryPattern:'J\\+(\\d+)\\s*(?:à|[-–])\\s*J\\+(\\d+)',
  milestonePattern:'S(\\d+)',daysPerWeek:7,
};