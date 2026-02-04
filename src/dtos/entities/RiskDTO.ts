export enum RiskStatus {
  IDENTIFIED = 'identified',
  MONITORED = 'monitored',
  MITIGATED = 'mitigated',
  RESOLVED = 'resolved'
}

export enum RiskCategory {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  STRATEGIC = 'strategic',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety'
}

export interface RiskDTO {
  id?: string;
  projectId?: string;
  title: string;
  description?: string;
  probability: number;
  impact: number;
  status: RiskStatus;
  category: RiskCategory;
  mitigationStrategy?: string;
  identifiedBy?: string;
  identifiedDate?: string;
  relatedTasks?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRiskRequestDTO {
  projectId: string;
  title: string;
  description?: string;
  probability: number;
  impact: number;
  category: RiskCategory;
  mitigationStrategy?: string;
  identifiedBy?: string;
}

export interface UpdateRiskRequestDTO {
  title?: string;
  description?: string;
  probability?: number;
  impact?: number;
  status?: RiskStatus;
  category?: RiskCategory;
  mitigationStrategy?: string;
  relatedTasks?: string[];
}

export interface RiskFormDataDTO {
  id?: string;
  title?: string;
  description?: string;
  level?: 'low' | 'medium' | 'high';
  probability?: number | 'low' | 'medium' | 'high';
  impact?: number;
  mitigation?: string;
  status?: 'identified' | 'mitigated' | 'resolved';
}
