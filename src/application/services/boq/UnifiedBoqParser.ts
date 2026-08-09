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

export interface UnifiedParseResult extends ParseResult {
  format: MeterInputSourceFormat;
  fileName: string;
  autoMapping: ImportMapping;
}

export interface ToMeterInputsContext {
  source: BoqSource;
  contextId: string;
  phaseId?: string;
  referentialCode?: ReferentialType;
  fiscalProfileCode?: string;
}

function detectFormat(file: File): MeterInputSourceFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.xlsx')) return 'xlsx';
  if (name.endsWith('.xls')) return 'xls';
  if (name.endsWith('.csv')) return 'csv';
  return 'xlsx';
}

export class UnifiedBoqParser {
  private readonly orchestrator = new BoqImportOrchestrator();

  async parse(file: File): Promise<UnifiedParseResult> {
    const parsed = await this.orchestrator.parseFile(file);
    return {
      ...parsed,
      format: detectFormat(file),
      fileName: file.name,
      autoMapping: BoqImportOrchestrator.autoMap(parsed.columns),
    };
  }

  toMeterInputs(
    parsed: UnifiedParseResult,
    mapping: ImportMapping,
    ctx: ToMeterInputsContext,
  ): MeterInputDTO[] {
    const dtos = BoqImportOrchestrator.toDtos(parsed.rows, mapping, {
      ...ctx,
      detectedVatRate: parsed.detectedFiscal?.vatRate ?? null,
    });
    return dtos.map((dto, idx) => ({
      ...dto,
      provenance: {
        format: parsed.format,
        fileName: parsed.fileName,
        rowIndex: idx + 1,
      },
    }));
  }

  static fromCalculator(
    lines: Omit<MeterInputDTO, 'provenance'>[],
    fileName = 'AdvancedQuantityCalculator',
  ): MeterInputDTO[] {
    return lines.map((l, idx) => ({
      ...l,
      provenance: { format: 'calculator', fileName, rowIndex: idx + 1 },
    }));
  }
}

export const unifiedBoqParser = new UnifiedBoqParser();
