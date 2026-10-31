/**
 * UnifiedBoqParser — single entry point for BOQ document ingestion.
 *
 * Consolidates the three legacy parsing paths (PDF / Excel / CSV / calculator)
 * behind one hexagonal facade producing MeterInputDTO[]. Downstream code
 * (BoqImportDialog, DQE tab, Tender Estimator, AdvancedQuantityCalculator)
 * must depend on this class, never on individual parsers.
 */
import type { ReferentialType } from '@/config/referentials';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { MeterInputDTO, MeterInputSourceFormat } from '@/dtos/boq/MeterInputDTO';
import { BoqImportOrchestrator, type ImportMapping } from './BoqImportOrchestrator';
import type { ParseResult } from './parsers/IDocumentParser';
import type { NumberFormatMode } from './parsers/numberParsing';
import type { EdbPayload } from './parsers/JsonBoqParser';
import { MeterService } from './MeterService';
import { TechnicalPlanService } from './TechnicalPlanService';
import type { TechnicalPlanDTO, TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';

export interface UnifiedParseResult extends ParseResult {
  format: MeterInputSourceFormat;
  fileName: string;
  autoMapping: ImportMapping;
  /** Charge utile EDB (JSON structuré) lorsque le fichier en contient une. */
  edb?: EdbPayload;
  technicalPlan?: TechnicalPlanDTO;
}

export interface ToMeterInputsContext {
  source: BoqSource;
  contextId: string;
  phaseId?: string;
  referentialCode?: ReferentialType;
  fiscalProfileCode?: string;
  /** Convention numérique du document (choisie par l'utilisateur à l'upload). */
  numberFormat?: NumberFormatMode;
}

function detectFormat(file: File): MeterInputSourceFormat {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.xlsx')) return 'xlsx';
  if (name.endsWith('.xls')) return 'xls';
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.json')) return 'json';
  return 'xlsx';
}

export class UnifiedBoqParser {
  constructor(
    private readonly orchestrator: Pick<BoqImportOrchestrator, 'parseFile'> = new BoqImportOrchestrator(),
    private readonly plans = new TechnicalPlanService(),
  ) {}

  async parse(file: File): Promise<UnifiedParseResult> {
    const format = detectFormat(file);
    const parsed = (await this.orchestrator.parseFile(file)) as ParseResult & { edb?: EdbPayload };
    const autoMapping = BoqImportOrchestrator.autoMap(parsed.columns);
    // A PDF without usable table lines is reviewed as a drawing, including mixed text/image plans.
    if (format === 'pdf' && !BoqImportOrchestrator.toDtos(parsed.rows, autoMapping, { source: 'dqe', contextId: 'preview' }).length) {
      const technicalPlan = await this.plans.parse(file);
      return { ...parsed, rows: [], columns: [], format: 'plan', fileName: file.name, autoMapping: {}, technicalPlan };
    }
    return {
      ...parsed,
      format,
      fileName: file.name,
      autoMapping,
    };
  }

  toMeterInputs(
    parsed: UnifiedParseResult,
    mapping: ImportMapping,
    ctx: ToMeterInputsContext,
  ): MeterInputDTO[] {
    if (parsed.technicalPlan) return TechnicalPlanService.toMeterInputs(parsed.technicalPlan, parsed.technicalPlan.elements, ctx);
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, {
      ...ctx,
      detectedVatRate: parsed.detectedFiscal?.vatRate ?? null,
      detectedFiscal: parsed.detectedFiscal ?? null,
      parties: parsed.parties ?? null,
    });

    return MeterService.enrich(dtos.map((dto, idx) => ({
      ...dto,
      provenance: {
        format: parsed.format,
        fileName: parsed.fileName,
        rowIndex: idx + 1,
      },
    })));
  }

  async reviewPlan(parsed: UnifiedParseResult, elements: readonly TechnicalPlanElementDTO[], file: File, ctx: ToMeterInputsContext): Promise<MeterInputDTO[]> {
    if (!parsed.technicalPlan) throw new Error('No plan selected');
    const inputs = TechnicalPlanService.toMeterInputs(parsed.technicalPlan, elements, ctx);
    if (!inputs.length) throw new Error('No confirmed elements');
    const documentId = await this.plans.archive(file, { ...parsed.technicalPlan, elements: [...elements] }, ctx);
    return TechnicalPlanService.toMeterInputs(parsed.technicalPlan, elements, ctx, documentId);
  }

  static fromCalculator(
    lines: Omit<MeterInputDTO, 'provenance'>[],
    fileName = 'AdvancedQuantityCalculator',
  ): MeterInputDTO[] {
    return MeterService.enrich(lines.map((l, idx) => ({
      ...l,
      provenance: { format: 'calculator', fileName, rowIndex: idx + 1 },
    })));
  }

  async parseAndMeter(file: File, ctx: ToMeterInputsContext): Promise<MeterInputDTO[]> {
    const parsed = await this.parse(file);
    return this.toMeterInputs(parsed, parsed.autoMapping, ctx);
  }
}

export const unifiedBoqParser = new UnifiedBoqParser();
