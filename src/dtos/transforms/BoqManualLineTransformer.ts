import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { MeterInputDTO } from '@/dtos/boq/MeterInputDTO';

/** Maps assisted/inline form fields to the canonical metering input. */
export class BoqManualLineTransformer {
  static formToMeterInput(
    form: Partial<BoqLineDTO>,
    context: Pick<BoqLineDTO, 'source' | 'contextId' | 'documentId' | 'phaseId' | 'milestoneId' | 'taskId' | 'metadata'>,
  ): MeterInputDTO {
    return {
      ...context,
      designation: '', unit: 'u', quantity: 0, unitPrice: 0,
      resourceType: 'material', sourceType: 'rapide',
      ...form,
      source: context.source, contextId: context.contextId, documentId: context.documentId,
      metadata: { ...context.metadata, ...form.metadata }, status: 'draft',
    };
  }
}