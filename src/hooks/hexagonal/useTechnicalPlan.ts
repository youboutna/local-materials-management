import { useMemo, useState } from 'react';
import { TechnicalPlanService } from '@/application/services/boq/TechnicalPlanService';
import { PdfTechnicalPlanReader } from '@/infrastructure/adapters/PdfTechnicalPlanReader';
import type { TechnicalPlanDTO, TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';
import type { ToMeterInputsContext } from '@/application/services/boq/UnifiedBoqParser';

export function useTechnicalPlan() {
  const service = useMemo(() => new TechnicalPlanService(new PdfTechnicalPlanReader()), []);
  const [plan, setPlan] = useState<TechnicalPlanDTO | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parse = async (source: File) => {
    setPending(true); setError(null); setPlan(null); setFile(null);
    try { const result = await service.parse(source); setPlan(result); setFile(source); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setPending(false); }
  };
  const prepare = async (elements: TechnicalPlanElementDTO[], ctx: ToMeterInputsContext) => {
    if (!plan || !file) throw new Error('No plan selected');
    setPending(true); setError(null);
    try {
      // Validate before uploading; archive never bypasses DocumentService cleanup.
      const inputs = TechnicalPlanService.toMeterInputs(plan, elements, ctx);
      if (!inputs.length) throw new Error('No confirmed elements');
      const documentId = await service.archive(file, { ...plan, elements }, ctx);
      return TechnicalPlanService.toMeterInputs(plan, elements, ctx, documentId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); throw cause; }
    finally { setPending(false); }
  };
  return { plan, isPending, error, parse, prepare, reset: () => { setPlan(null); setFile(null); setError(null); } };
}