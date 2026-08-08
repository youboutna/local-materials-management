/**
 * Project Analytics Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { TenderEstimateMetricsDTO } from '@/dtos/entities/AdvancedTenderEstimateDTO';

export interface ProjectAnalyticsDTO extends Omit<ProjectDTO, 'id' | 'createdAt' | 'updatedAt'> {
  costEfficiency: number;
  schedulePerformance: number;
  stakeholderSatisfaction: number;
  cpi: number;
}

export interface ProjectMetricsDTO extends TenderEstimateMetricsDTO {
  totalMilestones: number;
  completedMilestones: number;
  overdueTasks: number;
}

export interface ProjectRiskDTO extends RiskDTO {
  projectId: string;
  assignedTo?: string;
}

export interface CreateProjectRiskRequestDTO {
  projectId: string;
  riskTitle: string;
  riskDescription: string;
  riskCategory: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategy: string;
  targetResolutionDate?: string;
  assignedTo?: string;
}

export interface UpdateProjectRiskRequestDTO {
  riskTitle?: string;
  riskDescription?: string;
  riskCategory?: string;
  probability?: 'low' | 'medium' | 'high';
  impact?: 'low' | 'medium' | 'high';
  mitigationStrategy?: string;
  status?: 'active' | 'mitigated' | 'closed';
  targetResolutionDate?: string;
  assignedTo?: string;
}
