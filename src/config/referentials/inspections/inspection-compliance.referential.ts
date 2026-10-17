/** Completed inspections may establish phase compliance; pending/rejected ones may not. */
export const INSPECTION_PHASE_COMPLIANCE = {
  acceptedStatuses: ['completed', 'approved'] as readonly string[],
};