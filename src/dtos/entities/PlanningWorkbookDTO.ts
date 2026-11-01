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
  /** Code depth mapped to a phase sub-component (milestone), e.g. 2 for 1.1. */
  subComponentDepth: number;
  /** Leading rows scanned for column headers (financing sources, scale). */
  headerRows: number;
  /** Uncoded titles carrying their own code, e.g. "5.1. Sous composante". */
  titleCodePattern: string;
  /** Header labels that group financing columns without being a source. */
  financingGroupPattern: string;
  /** Header labels of period columns (quarters, months), never financing. */
  periodPattern: string;
  /** Header text indicating amounts expressed in thousands. */
  thousandsPattern: string;
  /** Sheets used as recap/summary evidence rather than phases. */
  summarySheetPattern: string;
  /** Recap label identifying a component and its number. */
  componentPattern: string;
  /** Uncoded header/section rows (e.g. "Libellé", "I. Investment Costs") kept as structure, not as data to complete. */
  headerTitlePattern: string;
  /** Relative tolerance for quantity × unit price vs source amount (0.005 = 0.5 %). */
  arithmeticTolerance: number;
}
/** Default field values aligned with the project JSON template (phase/task/project). */
export interface PlanningTemplateDefaultsDTO {
  project?: Record<string, string | number | boolean>;
  phase?: Record<string, string | number | boolean>;
  task?: Record<string, string | number | boolean>;
  milestone?: Record<string, string | number | boolean>;
}
export interface PlanningFinancingShareDTO { source: string; column: number; sourceAmount: number; amount: number }
export interface PlanningWorkbookSuggestionDTO { title?: string; amountMultiplier?: number; budget?: number; components: Record<string, string> }
export interface PlanningWorkbookInputDTO {
  source: PlanningWorkbookDTO;
  title: string;
  reference: string;
  startDate: string;
  currency: string;
  budget: number;
  referentialCode: string;
  mapping: PlanningWorkbookMappingDTO;
  templateDefaults?: PlanningTemplateDefaultsDTO;
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
    subComponent?: string;
    financing?: PlanningFinancingShareDTO[];
    kind: 'group' | 'task' | 'structural' | 'unmapped';
  }>;
  summary: Array<{ sheet: string; phase: string; subComponents: number; tasks: number; amount: number; financing: Record<string, number> }>;
  warnings: Array<{ code: 'missing_code' | 'recap_difference' | 'duplicate_code' | 'arithmetic_difference' | 'period_review'; sheet: string; row: number }>;
}