import type { ProjectImportRow } from '@/application/services/ProjectImportExportService';

export interface PlanningSourceCellDTO {
  value: string | number | boolean | null;
  formula?: string;
  formatted?: string;
  style?: unknown;
}
export interface PlanningSourceSheetDTO {
  name: string;
  rows: PlanningSourceCellDTO[][];
  merges: string[];
}
export interface PlanningWorkbookDTO {
  filename: string;
  sheets: PlanningSourceSheetDTO[];
  narrative?: string;
}
export interface PlanningWorkbookMappingDTO {
  codeColumn: number;
  titleColumn: number;
  responsibleColumn: number;
  associatesColumn: number;
  unitColumn: number;
  quantityColumn: number;
  unitPriceColumn: number;
  amountColumn: number;
  amountMultiplier: number;
  codePattern: string;
  totalPattern: string;
}
export interface PlanningWorkbookInputDTO {
  source: PlanningWorkbookDTO;
  title: string;
  reference: string;
  startDate: string;
  currency: string;
  budget: number;
  referentialCode: string;
  mapping: PlanningWorkbookMappingDTO;
}
export interface PlanningWorkbookPreviewDTO {
  project: ProjectImportRow;
  source: PlanningWorkbookDTO;
  rows: Array<{
    sheet: string;
    row: number;
    code: string;
    title: string;
    responsible: string;
    quantity?: number;
    unit: string;
    sourceAmount?: number;
    amount?: number;
    kind: 'group' | 'task' | 'unmapped';
  }>;
  warnings: Array<{ code: 'missing_code' | 'duplicate_code' | 'arithmetic_difference' | 'period_review'; sheet: string; row: number }>;
}