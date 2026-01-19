/**
 * Inspections Hook - Enhanced with InspectionDomainTransformer Integration
 * Uses InspectionDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from '@/application/services/RepositoryFactory';
import { InspectionService } from "@/application/services/InspectionService";
import { InspectionDomainTransformer, CreateInspectionRequestDto, UpdateInspectionRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreateInspectionDTO = Omit<CreateInspectionRequestDto, 'status'> & { status?: any };
type ServiceUpdateInspectionDTO = Omit<UpdateInspectionRequestDto, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UseInspectionsHexResult {
  inspections: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createInspection: (data: CreateInspectionRequestDto) => void;
  updateInspection: ({ id, data }: { id: string; data: UpdateInspectionRequestDto }) => void;
  deleteInspection: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getInspectionComplianceScore: (inspection: any) => number;
  getInspectionQualityMetrics: (inspection: any) => { qualityScore: number; defectRate: number };
  getInspectionRiskLevel: (inspection: any) => 'low' | 'medium' | 'high';
  getInspectionDaysSinceLast: (inspection: any) => number;
  getInspectionAnalytics: () => any;
  validateInspectionWithReferential: (inspection: any, referentialType: string) => Promise<any>;
  generateInspectionReport: (inspection: any) => any;
}

/**
 * Enhanced hook for inspections management with UI-specific features
 */
export const useInspectionsHex = (projectId?: string): UseInspectionsHexResult => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // TODO: Implement InspectionRepository in RepositoryFactory
  // For now, using a mock implementation
  const inspectionRepository = {} as any; // RepositoryFactory.getInspectionRepository();
  const inspectionService = new InspectionService(inspectionRepository, InspectionDomainTransformer);

  // Query for inspections list
  const {
    data: inspections = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inspections', projectId],
    queryFn: async (): Promise<any[]> => {
      try {
        // Mock data for now
        return [];
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
        const createdInspection = await inspectionService.createInspection(serviceData as any);
        return createdInspection;
      } catch (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success(`L'inspection "${data.inspector}" a été créée avec succès.`);
      navigate('/inspections');
    },
    onError: (error) => {
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
        const updatedInspection = await inspectionService.updateInspection(id, serviceData as any);
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
    onError: (error) => {
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
    onError: (error) => {
      console.error('Error deleting inspection:', error);
      toast.error("Impossible de supprimer l'inspection.");
    }
  });

  // Enhanced UI functions
  const getInspectionComplianceScore = (inspection: any): number => {
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

  const getInspectionQualityMetrics = (inspection: any): { qualityScore: number; defectRate: number } => {
    const qualityScore = inspection.qualityScore || 100;
    const defectRate = inspection.defectRate || 0;
    
    return {
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
      defectRate: Math.max(0, Math.min(100, defectRate))
    };
  };

  const getInspectionRiskLevel = (inspection: any): 'low' | 'medium' | 'high' => {
    const complianceScore = getInspectionComplianceScore(inspection);
    const quality = getInspectionQualityMetrics(inspection);
    const daysSinceLast = getInspectionDaysSinceLast(inspection);
    
    if (complianceScore < 70 || quality.qualityScore < 70 || daysSinceLast > 90) return 'high';
    if (complianceScore < 85 || quality.qualityScore < 85 || daysSinceLast > 60) return 'medium';
    return 'low';
  };

  const getInspectionDaysSinceLast = (inspection: any): number => {
    const lastInspectionDate = inspection.lastInspectionDate ? new Date(inspection.lastInspectionDate) : null;
    const now = new Date();
    
    if (!lastInspectionDate) return 0;
    return Math.floor((now.getTime() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getInspectionAnalytics = () => {
    const totalInspections = inspections.length;
    const statusBreakdown = inspections.reduce((acc, inspection) => {
      const status = inspection.status || 'pending';
      if (status === 'completed') acc.completed++;
      else if (status === 'pending') acc.pending++;
      else if (status === 'failed') acc.failed++;
      return acc;
    }, { completed: 0, pending: 0, failed: 0 });
    
    const averageComplianceScore = inspections.length > 0 
      ? inspections.reduce((sum, i) => sum + getInspectionComplianceScore(i), 0) / inspections.length 
      : 0;
    
    const riskBreakdown = inspections.reduce((acc, inspection) => {
      const risk = getInspectionRiskLevel(inspection);
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
  const validateSafetyReferential = (inspection: any) => {
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

  const validateQualityReferential = (inspection: any) => {
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

  const validateRegulatoryReferential = (inspection: any) => {
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

  const validateEnvironmentalReferential = (inspection: any) => {
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
  const generateInspectionRecommendations = (inspection: any, complianceScore: number, riskLevel: string) => {
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
    validateInspectionWithReferential: async (inspection: any, referentialType: string) => {
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
    generateInspectionReport: (inspection: any) => {
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

  // Update inspection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInspectionDTO }): Promise<InspectionDTO | null> => {
      const result = await InspectionService.updateInspection(id, data);
      if (!result) throw new Error('Failed to update inspection');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Succès",
        description: "Inspection mise à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete inspection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const result = await InspectionService.deleteInspection(id);
      if (!result) throw new Error('Failed to delete inspection');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Succès",
        description: "Inspection supprimée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get inspection by ID
  const getInspectionById = async (id: string): Promise<InspectionDTO | null> => {
    return await InspectionService.getInspectionById(id);
  };

  // Create inspection function (for backward compatibility)
  const createInspection = async (data: CreateInspectionDTO) => {
    return await createMutation.mutateAsync(data);
  };

  // Update inspection function (for backward compatibility)
  const updateInspection = async (id: string, data: UpdateInspectionDTO) => {
    return await updateMutation.mutateAsync({ id, data });
  };

  // Delete inspection function (for backward compatibility)
  const deleteInspection = async (id: string) => {
    return await deleteMutation.mutateAsync(id);
  };

  return {
    inspections,
    isLoading,
    error,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
    createInspection,
    updateInspection,
    deleteInspection,
    getInspectionById
  };

// Export pour compatibilité ascendante
export const useInspectionHex = useInspectionsHex;
