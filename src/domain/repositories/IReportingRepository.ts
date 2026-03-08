import { ProjectReportDTO, EnhancedPhaseDTO, ProjectAnalyticsDTO, FinancialMetricsDTO, RiskAssessmentDTO, RiskItemDTO } from '@/dtos/entities/ProjectReportDTO';

// Local type for report transformation
export interface ProjectData {
  id: string;
  title: string;
  [key: string]: unknown;
}
export interface IReportingRepository {
  // Project phases data
  getProjectPhases(projectId: string): Promise<EnhancedPhaseDTO[]>;
  
  // Inspections data
  getProjectInspections(projectId: string): Promise<any[]>; // TODO: Create InspectionDTO[] type
  
  // Real costs calculations
  calculateRealProjectCosts(projectId: string): Promise<FinancialMetricsDTO>;
  
  // Phase resource utilization
  calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any>;
  
  // Report data transformation
  transformProjectForReport(project: ProjectData): Promise<any>;
}
