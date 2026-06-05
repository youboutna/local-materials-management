import { ProjectReportDTO, EnhancedPhaseDTO, ProjectAnalyticsDTO, FinancialMetricsDTO, RiskAssessmentDTO, RiskItemDTO } from '@/dtos/entities/ProjectReportDTO';
import type { ReportSectionKey } from '@/config/referentials/reports/report-profiles.referential';

// Local type for report transformation input
export type ProjectData = {
  id: string;
  title: string;
  [key: string]: any;
};

/**
 * Hydrated section data keyed by ReportSectionKey.
 * Only sections requested by the caller are populated; others are empty arrays.
 */
export interface ReportSectionsData {
  materials: any[];
  inspections: any[];
  bankGuarantees: any[];
  insurance: any[];
  paymentBlocks: any[];
  suppliers: any[];
  documents: any[];
  employees: any[];
  escalationAlerts: any[];
  constructionMilestones: any[];
}

export interface IReportingRepository {
  // Project phases data
  getProjectPhases(projectId: string): Promise<EnhancedPhaseDTO[]>;

  // Inspections data
  getProjectInspections(projectId: string): Promise<any[]>;

  // Real costs calculations
  calculateRealProjectCosts(projectId: string): Promise<FinancialMetricsDTO>;

  // Phase resource utilization
  calculatePhaseResourceUtilization(projectId: string, phaseId: string): Promise<any>;

  // Report data transformation
  transformProjectForReport(project: ProjectData): Promise<any>;

  /**
   * Hydrate the data slices required by the report's enabled sections.
   * Sections not flagged true are returned as empty arrays so the PDF
   * can rely on stable shapes without conditional null-checks.
   */
  getProjectReportSections(
    projectId: string,
    sections: Partial<Record<ReportSectionKey, boolean>>,
  ): Promise<ReportSectionsData>;
}
