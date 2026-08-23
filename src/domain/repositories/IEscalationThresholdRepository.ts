/**
 * Escalation Threshold Repository Port (btp.escalation_thresholds)
 */

export interface EscalationThresholdRow {
  id: string;
  thresholdType: string;
  thresholdName: string;
  thresholdValue: number;
  thresholdUnit: string;
  severityLevel: string;
  escalationLevel: number;
  description?: string | null;
  isActive?: boolean | null;
  updatedAt?: string | null;
}

export interface IEscalationThresholdRepository {
  findAll(): Promise<EscalationThresholdRow[]>;
  update(id: string, updates: Partial<EscalationThresholdRow>): Promise<EscalationThresholdRow>;
  /** Upsert par (threshold_type, threshold_name) — persistance d'un défaut référentiel. */
  upsert(row: Omit<EscalationThresholdRow, 'id'>): Promise<EscalationThresholdRow>;
}

