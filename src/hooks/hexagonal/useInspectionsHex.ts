/**
 * Inspections Hook - Enhanced with InspectionDomainTransformer Integration
 * Uses InspectionDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { InspectionService } from "@/application/services/InspectionService";
import { useLanguage } from '@/contexts/LanguageContext';
import { CreateInspectionRequestDto, UpdateInspectionRequestDto } from "@/dtos/transforms";
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

// Types compatibles avec le service
type ServiceCreateInspectionDTO = Omit<CreateInspectionRequestDto, 'status'> & { status?: unknown };
type ServiceUpdateInspectionDTO = Omit<UpdateInspectionRequestDto, 'status'> & { status?: unknown };

type InspectionUI = {
  complianceScore?: number;
  criticalIssues?: unknown[];
  documents?: unknown[];
  qualityScore?: number;
  defectRate?: number;
  lastInspectionDate?: string;
  status?: string;
  type?: string;
  requiresSafetyEquipment?: boolean;
  requiresPermits?: boolean;
  highRiskArea?: boolean;
  criticalInspection?: boolean;
  regulatedActivity?: boolean;
  highValueInspection?: boolean;
  environmentalSensitiveArea?: boolean;
  generatesWaste?: boolean;
  potentialPollution?: boolean;
  safetyProtocols?: unknown;
  safetyEquipment?: unknown;
  inspectorSafetyTraining?: unknown;
  hazardAssessment?: unknown;
  qualityStandards?: unknown;
  qualityMetrics?: unknown;
  qualityControlProcedures?: unknown;
  qualityAssurance?: unknown;
  regulatoryCompliance?: unknown;
  permits?: unknown;
  regulatoryApprovals?: unknown;
  complianceDocumentation?: unknown;
  environmentalImpact?: unknown;
  environmentalCompliance?: unknown;
  wasteManagement?: unknown;
  pollutionControl?: unknown;
};

// Enhanced types for UI components
export interface UseInspectionsHexResult {
  inspections: unknown[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  createInspection: (data: CreateInspectionRequestDto) => void;
  updateInspection: ({ id, data }: { id: string; data: UpdateInspectionRequestDto }) => void;
  deleteInspection: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getInspectionComplianceScore: (inspection: InspectionUI) => number;
  getInspectionQualityMetrics: (inspection: InspectionUI) => { qualityScore: number; defectRate: number };
  getInspectionRiskLevel: (inspection: InspectionUI) => 'low' | 'medium' | 'high';
  getInspectionDaysSinceLast: (inspection: InspectionUI) => number;
  getInspectionAnalytics: () => {
    totalInspections: number;
    statusBreakdown: { completed: number; pending: number; failed: number };
    averageComplianceScore: number;
    riskBreakdown: { high: number; medium: number; low: number };
    compliantInspections: number;
    highRiskInspections: number;
  };
  validateInspectionWithReferential: (inspection: InspectionUI, referentialType: string) => Promise<{ isValid: boolean; errors: string[]; warnings: string[]; compliance?: string }>;
  generateInspectionReport: (inspection: InspectionUI) => unknown;
}

/**
 * Enhanced hook for inspections management with UI-specific features
 */
export const useInspectionsHex = (projectId?: string): UseInspectionsHexResult => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useLanguage();
  
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());

  // Query for inspections list
  const {
    data: inspections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inspections', projectId],
    queryFn: async (): Promise<unknown[]> => {
      try {
        if (projectId) {
          return await inspectionService.getInspectionsByProject(projectId);
        }
        return await inspectionService.getAllInspections();
      } catch (err) {
        console.error('Error fetching inspections:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
    enabled: true
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (inspectionData: CreateInspectionRequestDto) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreateInspectionDTO = { ...inspectionData };
        const partial = {
          projectId: serviceData.projectId,
          inspector: serviceData.inspector as any,
          date: serviceData.date,
          comments: serviceData.comments,
          phaseId: serviceData.phaseId,
          stepId: (serviceData as unknown as { stepId?: string }).stepId,
        };
        const createdInspection = await inspectionService.createInspection(partial as any);
        return createdInspection;
      } catch (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-monitoring'] });
      toast.success(`L'inspection "${data.inspector}" a été créée avec succès.`);
    },
    onError: (error: unknown) => {
      console.error('Error creating inspection:', error);
      toast.error("Impossible de créer l'inspection. Veuillez réessayer.");
    }
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInspectionRequestDto }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdateInspectionDTO = { ...data };
        const partial = {
          inspector: serviceData.inspector as any,
          date: serviceData.date,
          comments: serviceData.comments,
          phaseId: serviceData.phaseId,
          stepId: (serviceData as unknown as { stepId?: string }).stepId,
          progressAtInspection: (serviceData as unknown as { progressAtInspection?: number }).progressAtInspection,
          status: (serviceData as unknown as { status?: string }).status,
        };
        const updatedInspection = await inspectionService.updateInspection(id, partial as any);
        return updatedInspection;
      } catch (error) {
        console.error('Error updating inspection:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success(`L'inspection "${data.inspector}" a été mise à jour avec succès.`);
    },
    onError: (error: unknown) => {
      console.error('Error updating inspection:', error);
      toast.error("Impossible de mettre à jour l'inspection. Veuillez réessayer.");
    }
  });

  // Delete inspection mutation
  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await inspectionService.deleteInspection(id);
        return true;
      } catch (error) {
        console.error('Error deleting inspection:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success("L'inspection a été supprimée avec succès.");
    },
    onError: (error: unknown) => {
      console.error('Error deleting inspection:', error);
      toast.error("Impossible de supprimer l'inspection.");
    }
  });

  // Enhanced UI functions
  const getInspectionComplianceScore = (inspection: InspectionUI): number => {
    // Calcul basé sur la conformité, les documents et les problèmes
    const complianceScore = inspection.complianceScore || 100;
    const criticalIssues = inspection.criticalIssues || [];
    const documentsCount = inspection.documents?.length || 0;
    
    // Réduction du score pour les problèmes critiques
    const scoreReduction = criticalIssues.length * 15;
    // Bonus pour les documents complets
    const documentBonus = documentsCount >= 5 ? 10 : 0;
    
    return Math.max(0, Math.min(100, complianceScore - scoreReduction + documentBonus));
  };

  const getInspectionQualityMetrics = (inspection: InspectionUI): { qualityScore: number; defectRate: number } => {
    const qualityScore = inspection.qualityScore || 100;
    const defectRate = inspection.defectRate || 0;
    
    return {
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
      defectRate: Math.max(0, Math.min(100, defectRate))
    };
  };

  const getInspectionRiskLevel = (inspection: InspectionUI): 'low' | 'medium' | 'high' => {
    const complianceScore = getInspectionComplianceScore(inspection);
    const quality = getInspectionQualityMetrics(inspection);
    const daysSinceLast = getInspectionDaysSinceLast(inspection);
    
    if (complianceScore < 70 || quality.qualityScore < 70 || daysSinceLast > 90) return 'high';
    if (complianceScore < 85 || quality.qualityScore < 85 || daysSinceLast > 60) return 'medium';
    return 'low';
  };

  const getInspectionDaysSinceLast = (inspection: InspectionUI): number => {
    const lastInspectionDate = inspection.lastInspectionDate ? new Date(inspection.lastInspectionDate) : null;
    const now = new Date();
    
    if (!lastInspectionDate) return 0;
    return Math.floor((now.getTime() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getInspectionAnalytics = () => {
    const totalInspections = inspections.length;
    const statusBreakdown = inspections.reduce<{ completed: number; pending: number; failed: number }>((acc, inspection) => {
      const status = (inspection as InspectionUI | undefined)?.status || 'pending';
      if (status === 'completed') acc.completed++;
      else if (status === 'pending') acc.pending++;
      else if (status === 'failed') acc.failed++;
      return acc;
    }, { completed: 0, pending: 0, failed: 0 });
    
    const averageComplianceScore = inspections.length > 0 
      ? inspections.reduce<number>((sum, i) => sum + getInspectionComplianceScore(i as InspectionUI), 0) / inspections.length 
      : 0;
    
    const riskBreakdown = inspections.reduce<{ high: number; medium: number; low: number }>((acc, inspection) => {
      const risk = getInspectionRiskLevel(inspection as InspectionUI);
      if (risk === 'high') acc.high++;
      else if (risk === 'medium') acc.medium++;
      else acc.low++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });
    
    return {
      totalInspections,
      statusBreakdown,
      averageComplianceScore: Math.round(averageComplianceScore),
      riskBreakdown,
      compliantInspections: statusBreakdown.completed,
      highRiskInspections: riskBreakdown.high
    };
  };

  // Validation functions for different referential types
  const validateSafetyReferential = (inspection: InspectionUI) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate safety protocols
    if (!inspection.safetyProtocols) {
      warnings.push('Safety protocols not specified');
    }
    
    // Validate safety equipment
    if (!inspection.safetyEquipment && inspection.requiresSafetyEquipment) {
      errors.push('Safety equipment required for this inspection');
    }
    
    // Validate safety training
    if (!inspection.inspectorSafetyTraining) {
      warnings.push('Inspector safety training not verified');
    }
    
    // Validate hazard assessment
    if (!inspection.hazardAssessment && inspection.highRiskArea) {
      errors.push('Hazard assessment required for high-risk areas');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'safety'
    };
  };

  const validateQualityReferential = (inspection: InspectionUI) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate quality standards
    if (!inspection.qualityStandards) {
      warnings.push('Quality standards not specified');
    }
    
    // Validate quality metrics
    if (!inspection.qualityMetrics) {
      warnings.push('Quality metrics not measured');
    }
    
    // Validate quality control procedures
    if (!inspection.qualityControlProcedures) {
      warnings.push('Quality control procedures not documented');
    }
    
    // Validate quality assurance
    if (!inspection.qualityAssurance && inspection.criticalInspection) {
      errors.push('Quality assurance required for critical inspections');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'quality'
    };
  };

  const validateRegulatoryReferential = (inspection: InspectionUI) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate regulatory compliance
    if (!inspection.regulatoryCompliance) {
      warnings.push('Regulatory compliance not documented');
    }
    
    // Validate permits
    if (!inspection.permits && inspection.requiresPermits) {
      errors.push('Permits required for this inspection type');
    }
    
    // Validate regulatory approvals
    if (!inspection.regulatoryApprovals && inspection.regulatedActivity) {
      warnings.push('Regulatory approvals not obtained');
    }
    
    // Validate compliance documentation
    if (!inspection.complianceDocumentation && inspection.highValueInspection) {
      errors.push('Compliance documentation required for high-value inspections');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'regulatory'
    };
  };

  const validateEnvironmentalReferential = (inspection: InspectionUI) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate environmental impact
    if (!inspection.environmentalImpact) {
      warnings.push('Environmental impact assessment not conducted');
    }
    
    // Validate environmental compliance
    if (!inspection.environmentalCompliance && inspection.environmentalSensitiveArea) {
      errors.push('Environmental compliance required for sensitive areas');
    }
    
    // Validate waste management
    if (!inspection.wasteManagement && inspection.generatesWaste) {
      warnings.push('Waste management procedures not specified');
    }
    
    // Validate pollution control
    if (!inspection.pollutionControl && inspection.potentialPollution) {
      errors.push('Pollution control measures required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'environmental'
    };
  };

  // Generate inspection recommendations based on analysis
  const generateInspectionRecommendations = (inspection: InspectionUI, complianceScore: number, riskLevel: string) => {
    const recommendations: string[] = [];
    
    // Compliance-based recommendations
    if (complianceScore < 60) {
      recommendations.push('Immediate corrective actions required');
      recommendations.push('Review inspection procedures');
      recommendations.push('Additional training recommended');
    } else if (complianceScore < 80) {
      recommendations.push('Improvement actions recommended');
      recommendations.push('Monitor compliance trends');
    }
    
    // Risk-based recommendations
    if (riskLevel === 'high') {
      recommendations.push('Implement additional safety measures');
      recommendations.push('Increase inspection frequency');
      recommendations.push('Consider temporary suspension if necessary');
    } else if (riskLevel === 'medium') {
      recommendations.push('Enhanced monitoring recommended');
      recommendations.push('Review risk mitigation strategies');
    }
    
    // Type-based recommendations
    if (inspection.type === 'safety') {
      recommendations.push('Regular safety audits recommended');
      recommendations.push('Update safety protocols');
    } else if (inspection.type === 'quality') {
      recommendations.push('Quality improvement plan needed');
      recommendations.push('Enhance quality control measures');
    } else if (inspection.type === 'environmental') {
      recommendations.push('Environmental monitoring required');
      recommendations.push('Review environmental impact');
    }
    
    // Status-based recommendations
    if (inspection.status === 'failed') {
      recommendations.push('Root cause analysis required');
      recommendations.push('Corrective action plan needed');
    } else if (inspection.status === 'pending') {
      recommendations.push('Complete inspection follow-up');
      recommendations.push('Document all findings');
    }
    
    return recommendations;
  };

  return {
    inspections,
    isLoading,
    error,
    refetch,
    createInspection: createInspectionMutation.mutate,
    updateInspection: updateInspectionMutation.mutate,
    deleteInspection: deleteInspectionMutation.mutate,
    isCreating: createInspectionMutation.isPending,
    isUpdating: updateInspectionMutation.isPending,
    isDeleting: deleteInspectionMutation.isPending,
    getInspectionComplianceScore,
    getInspectionQualityMetrics,
    getInspectionRiskLevel,
    getInspectionDaysSinceLast,
    getInspectionAnalytics,
    validateInspectionWithReferential: async (inspection: InspectionUI, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'safety':
            return validateSafetyReferential(inspection);
          case 'quality':
            return validateQualityReferential(inspection);
          case 'regulatory':
            return validateRegulatoryReferential(inspection);
          case 'environmental':
            return validateEnvironmentalReferential(inspection);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateInspectionReport: (inspection: InspectionUI) => {
      try {
        const analytics = getInspectionAnalytics();
        const complianceScore = getInspectionComplianceScore(inspection);
        const qualityMetrics = getInspectionQualityMetrics(inspection);
        const riskLevel = getInspectionRiskLevel(inspection);
        
        return {
          inspection: {
            ...inspection,
            complianceScore,
            qualityMetrics,
            riskLevel,
            daysSinceLast: getInspectionDaysSinceLast(inspection)
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Inspection Analysis Report',
          summary: {
            totalInspections: analytics.totalInspections,
            compliantInspections: analytics.compliantInspections,
            averageComplianceScore: analytics.averageComplianceScore,
            highRiskInspections: analytics.highRiskInspections
          },
          recommendations: generateInspectionRecommendations(inspection, complianceScore, riskLevel),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'InspectionSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          inspection, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        }
      }
    }
  };
};

// =====================================================================
// useInspectionHex — single inspection fetch by id (UI-friendly DTO).
// Sépare clairement les deux cas d'usage (liste vs détail) — l'ancien
// alias pointait sur le hook liste et retournait `inspections[]` au lieu
// d'`inspection`, ce qui faisait planter /inspections/:id.
// =====================================================================
export const useInspectionHex = (id?: string) => {
  const queryClient = useQueryClient();
  const service = new InspectionService(RepositoryFactory.getInspectionRepository());

  const { data: inspection, isLoading, error, refetch } = useQuery({
    queryKey: ['inspection-hex', id],
    queryFn: async () => {
      if (!id) return null;
      const entity = await service.getInspectionById(id);
      if (!entity) return null;

      // Hydratation Entity → UI DTO camelCase (round-trip propre).
      const inspector = (entity as any).inspector;
      return {
        id: entity.id,
        projectId: entity.projectId ?? null,
        projectTitle: (entity as any).projectTitle ?? undefined,
        phaseId: entity.phaseId ?? null,
        date: typeof entity.date === 'string' ? entity.date : new Date(entity.date as any).toISOString(),
        inspector:
          typeof inspector === 'string'
            ? inspector
            : inspector?.name ?? inspector?.agency ?? '—',
        status: String(entity.status ?? 'scheduled'),
        progressAtInspection: entity.progressAtInspection ?? null,
        comments: entity.comments ?? '',
        createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : (entity.createdAt as any),
        updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : (entity.updatedAt as any),
      };
    },
    enabled: !!id,
    retry: 1,
  });

  return {
    inspection,
    isLoading,
    error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-hex', id] });
      return refetch();
    },
  };
};

