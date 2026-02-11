/**
 * Hexagonal Hook for Reports Management
 * Data-centric reporting hooks following hexagonal architecture
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ReportService, type GenerateProjectReportRequestDto, type GenerateProjectAnalyticsRequestDto, type GenerateFinancialMetricsRequestDto, type GenerateRiskAssessmentRequestDto, type GenerateComplianceReportRequestDto, type ProjectReportResultDto } from '@/application/services/ReportService';
import { 
  ProjectReportDTO,
  ProjectAnalyticsDTO,
  FinancialMetricsDTO,
  RiskAssessmentDTO,
  ComplianceReportDTO
} from '@/dtos/reports/reportDTOs';

// =================== HOOK INTERFACES ===================

export interface UseReportsHexResult {
  reports: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  generateReport: (data: GenerateProjectReportRequestDto) => void;
  isGenerating: boolean;
}

export interface UseProjectAnalyticsResult {
  analytics: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  generateAnalytics: (data: GenerateProjectAnalyticsRequestDto) => void;
  isGenerating: boolean;
}

export interface UseFinancialMetricsResult {
  metrics: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  generateMetrics: (data: GenerateFinancialMetricsRequestDto) => void;
  isGenerating: boolean;
}

export interface UseRiskAssessmentResult {
  assessment: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  generateAssessment: (data: GenerateRiskAssessmentRequestDto) => void;
  isGenerating: boolean;
}

export interface UseComplianceReportResult {
  report: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  generateReport: (data: GenerateComplianceReportRequestDto) => void;
  isGenerating: boolean;
}

// =================== MAIN HOOKS ===================

/**
 * Main hook for reports management
 */
export function useReportsHex(projectId?: string): UseReportsHexResult {
  const queryClient = useQueryClient();
  
  // Initialize service with hexagonal architecture
  const reportService = ReportService.getReportService();

  // Query for reports list
  const {
    data: reports = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['reports', projectId],
    queryFn: async (): Promise<any[]> => {
      if (!projectId) return [];
      
      try {
        // In a real implementation, this would fetch reports from repository
        const reportData = await reportService.generateProjectReport({
          projectId,
          reportType: 'summary'
        });
        
        return [reportData];
      } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });

  // Mutation for generating reports
  const generateReportMutation = useMutation({
    mutationFn: async (data: GenerateProjectReportRequestDto): Promise<ProjectReportResultDto> => {
      try {
        return await reportService.generateProjectReport(data);
      } catch (error) {
        console.error('Error generating report:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(`Rapport généré: ${data.metadata.reportType}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du rapport');
      console.error('Report generation error:', error);
    }
  });

  return {
    reports,
    isLoading,
    error,
    refetch,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending
  };
}

/**
 * Hook for project analytics
 */
export function useProjectAnalyticsHex(projectId: string): UseProjectAnalyticsResult {
  const queryClient = useQueryClient();
  const reportService = ReportService.getReportService();

  const {
    data: analytics = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      
      try {
        return await reportService.generateProjectAnalytics({
          projectId,
          timeRange: '90d',
          includeTrends: true,
          includeComparisons: true
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });

  const generateAnalyticsMutation = useMutation({
    mutationFn: async (data: GenerateProjectAnalyticsRequestDto): Promise<any> => {
      try {
        return await reportService.generateProjectAnalytics(data);
      } catch (error) {
        console.error('Error generating analytics:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Analytiques générées avec succès');
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération des analytiques');
      console.error('Analytics generation error:', error);
    }
  });

  return {
    analytics,
    isLoading,
    error,
    refetch,
    generateAnalytics: generateAnalyticsMutation.mutate,
    isGenerating: generateAnalyticsMutation.isPending
  };
}

/**
 * Hook for financial metrics
 */
export function useFinancialMetricsHex(projectId: string): UseFinancialMetricsResult {
  const queryClient = useQueryClient();
  const reportService = ReportService.getReportService();

  const {
    data: metrics = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['financial-metrics', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      
      try {
        return await reportService.generateFinancialMetrics({
          projectId,
          includeVariance: true,
          includeProjections: true,
          includeCashFlow: true
        });
      } catch (error) {
        console.error('Error fetching financial metrics:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });

  const generateMetricsMutation = useMutation({
    mutationFn: async (data: GenerateFinancialMetricsRequestDto): Promise<any> => {
      try {
        return await reportService.generateFinancialMetrics(data);
      } catch (error) {
        console.error('Error generating financial metrics:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Métriques financières générées');
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération des métriques financières');
      console.error('Financial metrics generation error:', error);
    }
  });

  return {
    metrics,
    isLoading,
    error,
    refetch,
    generateMetrics: generateMetricsMutation.mutate,
    isGenerating: generateMetricsMutation.isPending
  };
}

/**
 * Hook for risk assessment
 */
export function useRiskAssessmentHex(projectId: string): UseRiskAssessmentResult {
  const queryClient = useQueryClient();
  const reportService = ReportService.getReportService();

  const {
    data: assessment = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['risk-assessment', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      
      try {
        return await reportService.generateRiskAssessment({
          projectId,
          includeMitigation: true,
          severity: 'medium'
        });
      } catch (error) {
        console.error('Error fetching risk assessment:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });

  const generateAssessmentMutation = useMutation({
    mutationFn: async (data: GenerateRiskAssessmentRequestDto): Promise<any> => {
      try {
        return await reportService.generateRiskAssessment(data);
      } catch (error) {
        console.error('Error generating risk assessment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Évaluation des risques générée');
      queryClient.invalidateQueries({ queryKey: ['risk-assessment'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'évaluation des risques');
      console.error('Risk assessment generation error:', error);
    }
  });

  return {
    assessment,
    isLoading,
    error,
    refetch,
    generateAssessment: generateAssessmentMutation.mutate,
    isGenerating: generateAssessmentMutation.isPending
  };
}

/**
 * Hook for compliance reports
 */
export function useComplianceReportHex(projectId: string): UseComplianceReportResult {
  const queryClient = useQueryClient();
  const reportService = ReportService.getReportService();

  const {
    data: report = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['compliance-report', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      
      try {
        return await reportService.generateComplianceReport({
          projectId,
          includeRecommendations: true,
          includeHistory: true
        });
      } catch (error) {
        console.error('Error fetching compliance report:', error);
        throw error;
      }
    },
    enabled: !!projectId
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: GenerateComplianceReportRequestDto): Promise<any> => {
      try {
        return await reportService.generateComplianceReport(data);
      } catch (error) {
        console.error('Error generating compliance report:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Rapport de conformité généré');
      queryClient.invalidateQueries({ queryKey: ['compliance-report'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération du rapport de conformité');
      console.error('Compliance report generation error:', error);
    }
  });

  return {
    report,
    isLoading,
    error,
    refetch,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending
  };
}

// =================== UTILITY HOOKS ===================

/**
 * Hook for quick report generation with preset configurations
 */
export function useQuickReport(projectId: string, reportType: GenerateProjectReportRequestDto['reportType']) {
  const { generateReport, isGenerating } = useReportsHex(projectId);
  
  const generateQuickReport = () => {
    generateReport({
      projectId,
      reportType,
      includeAnalytics: reportType === 'detailed',
      includeFinancials: reportType === 'financial',
      includeRisks: reportType === 'risk_assessment',
      includeDocuments: reportType === 'detailed',
      includeCompliance: reportType === 'compliance'
    });
  };

  return {
    generateQuickReport,
    isGenerating
  };
}

/**
 * Hook for batch report generation
 */
export function useBatchReports(projectIds: string[]) {
  const queryClient = useQueryClient();
  const reportService = ReportService.getReportService();

  const batchGenerateMutation = useMutation({
    mutationFn: async (reportConfigs: GenerateProjectReportRequestDto[]): Promise<ProjectReportResultDto[]> => {
      try {
        const results = await Promise.all(
          reportConfigs.map(config => reportService.generateProjectReport(config))
        );
        return results;
      } catch (error) {
        console.error('Error generating batch reports:', error);
        throw error;
      }
    },
    onSuccess: (results) => {
      toast.success(`${results.length} rapports générés avec succès`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de la génération batch des rapports');
      console.error('Batch report generation error:', error);
    }
  });

  return {
    generateBatchReports: batchGenerateMutation.mutate,
    isGenerating: batchGenerateMutation.isPending
  };
}
