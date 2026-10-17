import { INSPECTION_PHASE_COMPLIANCE } from '@/config/referentials/inspections/inspection-compliance.referential';

export class InspectionComplianceService {
  static countByPhase(inspections: readonly { phaseId?: string | null; status: string }[]): Map<string, number> {
    const result = new Map<string, number>();
    for (const inspection of inspections) {
      const status = inspection.status.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      if (!inspection.phaseId || !INSPECTION_PHASE_COMPLIANCE.acceptedStatuses.includes(status)) continue;
      result.set(inspection.phaseId, (result.get(inspection.phaseId) ?? 0) + 1);
    }
    return result;
  }
}