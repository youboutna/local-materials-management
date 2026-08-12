/**
 * Escalation Threshold Repository Port (btp.escalation_thresholds)
 */

export interface EscalationThresholdRow {
  id: string;
  threshold_type: string;
  threshold_name: string;
  threshold_value: number;
  threshold_unit: string;
  severity_level: string;
  escalation_level: number;
  description?: string | null;
  is_active?: boolean | null;
  updated_at?: string | null;
}

export interface IEscalationThresholdRepository {
  findAll(): Promise<EscalationThresholdRow[]>;
  update(id: string, updates: Partial<EscalationThresholdRow>): Promise<EscalationThresholdRow>;
}
