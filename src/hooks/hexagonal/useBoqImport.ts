/**
 * useBoqImport — parse a file → mapping → BoqLineDTO[] → bulk persist.
 * Pure orchestration hook (no supabase.from() calls in components).
 */
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { BoqSourceDocumentService } from '@/application/services/boq/BoqSourceDocumentService';
import { unifiedBoqParser, type UnifiedParseResult } from '@/application/services/boq/UnifiedBoqParser';
import type { NumberFormatMode } from '@/application/services/boq/parsers/numberParsing';
import type { ReferentialType } from '@/config/referentials';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { getBoqDocumentService } from '@/application/services/boq/BoqDocumentService';
import type { TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useBoqImport(ctx: { source: BoqSource; contextId: string; phaseId?: string; referentialCode?: ReferentialType; fiscalProfileCode?: string }) {
  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dtos, setDtos] = useState<BoqLineDTO[]>([]);
  const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('auto');
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parseRun = useRef(0);
  /** Fichier analysé : archivé dans le Document Hub après persistance des lignes. */
  const sourceFile = useRef<File | null>(null);

  /** Abandonne complètement la session d’import, y compris le fichier analysé. */
  const reset = useCallback(() => {
    parseRun.current += 1;
    sourceFile.current = null;
    setParseResult(null);
    setMapping({});
    setDtos([]);
    setError(null);
    setBusy(false);
  }, []);

  const parseFile = useCallback(async (file: File, format: NumberFormatMode = numberFormat) => {
    sourceFile.current = file;
    const run = ++parseRun.current;
    setBusy(true); setError(null);
    try {
      const res = await unifiedBoqParser.parse(file);
      if (run !== parseRun.current) return;
      setParseResult(res);
      setMapping(res.autoMapping);
      setNumberFormat(format);
      setDtos(unifiedBoqParser.toMeterInputs(res, res.autoMapping, { ...ctx, fiscalProfileCode: ctx.fiscalProfileCode, numberFormat: format }));
    } catch (e) {
      if (run === parseRun.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (run === parseRun.current) setBusy(false);
    }
  }, [ctx, numberFormat]);

  const applyMapping = useCallback((next: ImportMapping) => {
    setMapping(next);
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, next, { ...ctx, fiscalProfileCode: ctx.fiscalProfileCode, numberFormat }));
  }, [parseResult, ctx, numberFormat]);

  const reviewPlan = async (elements: readonly TechnicalPlanElementDTO[]) => {
    if (!parseResult || !sourceFile.current) throw new Error('No document selected');
    const run = parseRun.current;
    setBusy(true); setError(null);
    try {
      const lines = await unifiedBoqParser.reviewPlan(parseResult, elements, sourceFile.current, ctx);
      if (run === parseRun.current) setDtos(lines);
      return lines;
    } catch (cause) {
      if (run === parseRun.current) setError(cause instanceof Error ? cause.message : String(cause));
      throw cause;
    } finally { if (run === parseRun.current) setBusy(false); }
  };

  /** Rejoue le mapping courant avec une autre convention numérique. */
  const applyNumberFormat = useCallback((next: NumberFormatMode) => {
    setNumberFormat(next);
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, mapping, { ...ctx, fiscalProfileCode: ctx.fiscalProfileCode, numberFormat: next }));
  }, [parseResult, mapping, ctx]);

  const commit = useCallback(async (lines: BoqLineDTO[] = dtos) => {
    if (!lines.length) return [];
    setBusy(true); setError(null);
    try {
      const persisted = await getBoqDocumentService().bulkCreate(lines);
      // Traçabilité : le fichier source rejoint le Document Hub (catégorie BOQ)
      // et reste téléchargeable depuis le document DQE.
      if (sourceFile.current && !parseResult?.technicalPlan) {
        await BoqSourceDocumentService.persist({
          file: sourceFile.current,
          contextId: ctx.contextId,
          source: ctx.source,
          // Le contextId porte le projet pour les métrés/DQE, l'appel d'offres
          // pour les estimations : on ne rattache que ce qui est certain.
          projectId: ctx.source === 'quantity_takeoff' || ctx.source === 'dqe' ? ctx.contextId : null,
          phaseId: ctx.phaseId ?? null,
          tenderId: ctx.source === 'tender_estimate' ? ctx.contextId : null,
          lineCount: persisted.length || lines.length,
        });
      }
      return persisted;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw new Error(msg);
    } finally { setBusy(false); }
  }, [dtos, ctx, parseResult]);

  // Re-classify existing rows when the project referential changes.
  useEffect(() => {
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, mapping, { ...ctx, fiscalProfileCode: ctx.fiscalProfileCode, numberFormat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.referentialCode]);

  return { parseResult, mapping, dtos, isBusy, error, parseFile, applyMapping, reviewPlan, commit, setDtos, numberFormat, applyNumberFormat, reset };
}
