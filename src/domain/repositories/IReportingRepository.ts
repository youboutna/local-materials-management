import { ProjectData } from '@/types/project';
import { ReportData, CostCalculation } from '@/types/reportTypes';

export interface IReportingRepository {
  // Project phases data
  getProjectPhases(projectId: string): Promise<any[]>;
  
  // Inspections data
  getProjectInspections(projectId: string): Promise<any[]>;
  
  // Real costs calculations
  calculateRealProjectCosts(projectId: string): Promise<any>;
  
  // Phase resource utilization
  calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any>;
  
  // Report data transformation
  transformProjectForReport(project: ProjectData): Promise<any>;
}
