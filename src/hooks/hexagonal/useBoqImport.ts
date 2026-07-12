/**
 * useBoqImport — parse a file → mapping → BoqLineDTO[] → bulk persist.
 * Pure orchestration hook (no supabase.from() calls in components).
 */
import { useCallback, useEffect, useState } from 'react';
import type { ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
import { unifiedBoqParser, type UnifiedParseResult } from '@/application/services/boq/UnifiedBoqParser';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/boq/BoqLine';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';
import type { ReferentialType } from '@/config/referentials';

export function useBoqImport(ctx: { source: BoqSource; contextId: string; phaseId?: string; referentialCode?: ReferentialType }) {
  const [parseResult, setParseResult] = useState<UnifiedParseResult | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dtos, setDtos] = useState<BoqLineDTO[]>([]);
  const [isBusy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setBusy(true); setError(null);
    try {
      const res = await unifiedBoqParser.parse(file);
      setParseResult(res);
      setMapping(res.autoMapping);
      setDtos(unifiedBoqParser.toMeterInputs(res, res.autoMapping, ctx));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }, [ctx]);

  const applyMapping = useCallback((next: ImportMapping) => {
    setMapping(next);
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, next, ctx));
  }, [parseResult, ctx]);

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
    if (parseResult) setDtos(unifiedBoqParser.toMeterInputs(parseResult, mapping, ctx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.referentialCode]);

  return { parseResult, mapping, dtos, isBusy, error, parseFile, applyMapping, commit, setDtos };
}
