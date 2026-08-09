/**
 * WbsRef — Work Breakdown Structure reference on a BoqLine.
 * IDs map to WBS_REFERENTIAL (config/referentials/wbs).
 */
export interface WbsRef {
  phaseId: string;
  milestoneId?: string;
  taskId?: string;
}
