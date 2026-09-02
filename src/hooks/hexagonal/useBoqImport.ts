/**
 * useBoqImport — parse a file → mapping → BoqLineDTO[] → bulk persist.
 * Pure orchestration hook (no supabase.from() calls in components).
 */
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { unifiedBoqParser, type UnifiedParseResult } from '@/application/services/boq/UnifiedBoqParser';
import type { NumberFormatMode } from '@/application/services/boq/parsers/numberParsing';
import type { ReferentialType } from '@/config/referentials';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useBoqImport(ctx: { source: BoqSource; contextId: string; phaseId?: string; referentialCode?: ReferentialType; fiscalProfileCode?: string }) {
  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dtos, setDtos] = useState<BoqLineDTO[]>([]);
  const [numberFormat, setNumberFormat] = useState<NumberFormatMode>('auto');
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parseRun = useRef(0);

  /** Abandonne complètement la session d’import, y compris le fichier analysé. */
  const reset = useCallback(() => {
    parseRun.current += 1;
    setParseResult(null);
    setMapping({});
    setDtos([]);
    setError(null);
    setBusy(false);
  }, []);

  const parseFile = useCallback(async (file: File, format: NumberFormatMode = numberFormat) => {
    const run = ++parseRun.current;
    setBusy(true); setError(null);
    try {
      const res = await unifiedBoqParser.parse(file);
      if (run !== parseRun.current) return;
      setParseResult(res);
      setMapping(res.autoMapping);
      setNumberFormat(format);
      setDtos(unifiedBoqParser.toMeterInputs(res, res.autoMapping, { ...ctx, numberFormat: format }));
    } catch (e) {
      if (run === parseRun.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (run === parseRun.current) setBusy(false);
    }
  }, [ctx, numberFormat]);

  const applyMapping = useCallback((next: ImportMapping) => {
    setMapping(next);
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, next, { ...ctx, numberFormat }));
  }, [parseResult, ctx, numberFormat]);

  /** Rejoue le mapping courant avec une autre convention numérique. */
  const applyNumberFormat = useCallback((next: NumberFormatMode) => {
    setNumberFormat(next);
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, mapping, { ...ctx, numberFormat: next }));
  }, [parseResult, mapping, ctx]);

  const commit = useCallback(async (lines: BoqLineDTO[] = dtos) => {
    if (!lines.length) return [];
    setBusy(true); setError(null);
    try {
      const persisted = await boqRepository.bulkCreate(lines);
      return persisted;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw new Error(msg);
    } finally { setBusy(false); }
  }, [dtos]);

  // Re-classify existing rows when the project referential changes.
  useEffect(() => {
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, mapping, { ...ctx, numberFormat }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.referentialCode]);

  return { parseResult, mapping, dtos, isBusy, error, parseFile, applyMapping, commit, setDtos, numberFormat, applyNumberFormat, reset };
}
