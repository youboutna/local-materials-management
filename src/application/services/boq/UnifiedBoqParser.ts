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

export interface UnifiedParseResult extends ParseResult {
  format: MeterInputSourceFormat;
  fileName: string;
  autoMapping: ImportMapping;
  /** Charge utile EDB (JSON structuré) lorsque le fichier en contient une. */
  edb?: EdbPayload;
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
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.xlsx')) return 'xlsx';
  if (name.endsWith('.xls')) return 'xls';
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.json')) return 'json';
  return 'xlsx';
}

export class UnifiedBoqParser {
  private readonly orchestrator = new BoqImportOrchestrator();

  async parse(file: File): Promise<UnifiedParseResult> {
    const parsed = (await this.orchestrator.parseFile(file)) as ParseResult & { edb?: EdbPayload };
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
