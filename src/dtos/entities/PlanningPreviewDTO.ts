import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';
export interface PlanningTextMappingDTO {
  delimiter: string;
  phaseColumn: number;
  missionsColumn: number;
  scheduleColumn: number;
  deliverableColumn: number;
  weekPattern: string;
  postDeliveryPattern: string;
  milestonePattern: string;
  daysPerWeek: number;
}
export interface PlanningPreviewInputDTO {
  text: string; title: string; reference: string; startDate: string;
  currency: string; referentialCode: string; mapping: PlanningTextMappingDTO;
}
export interface PlanningPreviewDTO {
  project: ProjectImportRow;
  unmatchedLines: Array<{line:number;text:string}>;
  warnings: string[];
  sourceText: string;
}