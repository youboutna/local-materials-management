/**
 * Hexagonal Hook for Reports Management
 * Data-centric reporting hooks following hexagonal architecture
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReportService, type GenerateProjectReportRequestDto, type GenerateProjectAnalyticsRequestDto, type GenerateFinancialMetricsRequestDto, type GenerateRiskAssessmentRequestDto, type GenerateComplianceReportRequestDto, type ProjectReportResultDto, getReportService} from '@/application/services/ReportService';

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
  const reportService = getReportService();

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

  const generateReportMutation = useMutation({
    mutationFn: async (data: GenerateProjectReportRequestDto): Promise<ProjectReportResultDto> => {
      return await reportService.generateProjectReport(data);
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
    error: error ? (error as Error).message : null,
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
  const reportService = getReportService();

  const {
    data: analytics = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      return await reportService.generateProjectAnalytics({
        projectId,
        timeRange: '90d',
        includeTrends: true,
        includeComparisons: true
      });
    },
    enabled: !!projectId
  });

  const generateAnalyticsMutation = useMutation({
    mutationFn: async (data: GenerateProjectAnalyticsRequestDto): Promise<any> => {
      return await reportService.generateProjectAnalytics(data);
    },
    onSuccess: () => {
      toast.success('Analytiques générées avec succès');
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
    },
    onError: () => {
      toast.error('Erreur lors de la génération des analytiques');
    }
  });

  return {
    analytics,
    isLoading,
    error: error ? (error as Error).message : null,
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
  const reportService = getReportService();

  const {
    data: metrics = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['financial-metrics', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      return await reportService.generateFinancialMetrics({
        projectId,
        includeVariance: true,
        includeProjections: true,
        includeCashFlow: true
      });
    },
    enabled: !!projectId
  });

  const generateMetricsMutation = useMutation({
    mutationFn: async (data: GenerateFinancialMetricsRequestDto): Promise<any> => {
      return await reportService.generateFinancialMetrics(data);
    },
    onSuccess: () => {
      toast.success('Métriques financières générées');
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
    },
    onError: () => {
      toast.error('Erreur lors de la génération des métriques financières');
    }
  });

  return {
    metrics,
    isLoading,
    error: error ? (error as Error).message : null,
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
  const reportService = getReportService();

  const {
    data: assessment = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['risk-assessment', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      // ReportService doesn't have generateRiskAssessment - use generateProjectReport with risk type
      return await reportService.generateProjectReport({
        projectId,
        reportType: 'risk_assessment',
        includeRisks: true
      });
    },
    enabled: !!projectId
  });

  const generateAssessmentMutation = useMutation({
    mutationFn: async (data: GenerateRiskAssessmentRequestDto): Promise<any> => {
      return await reportService.generateProjectReport({
        projectId: data.projectId,
        reportType: 'risk_assessment',
        includeRisks: true
      });
    },
    onSuccess: () => {
      toast.success('Évaluation des risques générée');
      queryClient.invalidateQueries({ queryKey: ['risk-assessment'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'évaluation des risques');
    }
  });

  return {
    assessment,
    isLoading,
    error: error ? (error as Error).message : null,
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
  const reportService = getReportService();

  const {
    data: report = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['compliance-report', projectId],
    queryFn: async (): Promise<any> => {
      if (!projectId) throw new Error('Project ID is required');
      // ReportService doesn't have generateComplianceReport - use generateProjectReport with compliance type
      return await reportService.generateProjectReport({
        projectId,
        reportType: 'compliance',
        includeCompliance: true
      });
    },
    enabled: !!projectId
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: GenerateComplianceReportRequestDto): Promise<any> => {
      return await reportService.generateProjectReport({
        projectId: data.projectId,
        reportType: 'compliance',
        includeCompliance: true
      });
    },
    onSuccess: () => {
      toast.success('Rapport de conformité généré');
      queryClient.invalidateQueries({ queryKey: ['compliance-report'] });
    },
    onError: () => {
      toast.error('Erreur lors de la génération du rapport de conformité');
    }
  });

  return {
    report,
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
    generateReport: generateReportMutation.mutate,
    isGenerating: generateReportMutation.isPending
  };
}

// =================== UTILITY HOOKS ===================

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

export function useBatchReports(projectIds: string[]) {
  const queryClient = useQueryClient();
  const reportService = getReportService();

  const batchGenerateMutation = useMutation({
    mutationFn: async (reportConfigs: GenerateProjectReportRequestDto[]): Promise<ProjectReportResultDto[]> => {
      const results = await Promise.all(
        reportConfigs.map(config => reportService.generateProjectReport(config))
      );
      return results;
    },
    onSuccess: (results) => {
      toast.success(`${results.length} rapports générés avec succès`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: () => {
      toast.error('Erreur lors de la génération batch des rapports');
    }
  });

  return {
    generateBatchReports: batchGenerateMutation.mutate,
    isGenerating: batchGenerateMutation.isPending
  };
}