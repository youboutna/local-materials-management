/**
 * Projects Hook - Enhanced with ProjectTransformer Integration
 * Uses ProjectTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ProjectService } from "@/application/services/ProjectService";
import { ProjectData } from "@/types/project";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
interface ProjectAnalytics {
  progress: number;
  budgetUsage: number;
  riskScore: number;
  issues: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: string;
}

interface ProjectReport {
  summary: string;
  details: Record<string, unknown>;
  generatedAt: string;
}

// Enhanced types for UI components
export interface UseProjectsResult {
  projects: ProjectData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createProject: (data: any) => void;
  updateProject: ({ id, data }: { id: string; data: any }) => void;
  deleteProject: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getProjectHealth: (project: ProjectData) => 'healthy' | 'warning' | 'critical';
  getProjectProgress: (project: ProjectData) => number;
  getProjectDuration: (project: ProjectData) => string;
  getProjectRisk: (project: ProjectData) => 'low' | 'medium' | 'high';
  getProjectAnalytics: () => ProjectAnalytics;
  validateProjectWithReferential: (project: ProjectData, referentialType: string) => Promise<ValidationResult>;
  generateProjectReport: (project: ProjectData) => ProjectReport;
}

/**
 * Enhanced hook for projects management with UI-specific features
 */
export const useProjects = (): UseProjectsResult => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository);

  // Query for projects list
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectData[]> => {
      try {
        const projectDTOs = await projectService.getAllProjects();
        return projectDTOs as ProjectData[];
      } catch (err) {
        console.error('Error fetching projects:', err);
        throw err;
      }
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      try {
        const createdProject = await projectService.createProject({
          ...projectData,
          startDate: projectData.startDate || projectData.start_date,
          endDate: projectData.endDate || projectData.end_date,
          status: projectData.status || 'draft',
          progress: 0,
          estimatedCost: projectData.budget || 0,
          geographicZone: '',
          terrainType: '',
          environmentalConstraints: ''
        });
        return createdProject;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Le projet "${data.title}" a été créé avec succès.`);
      navigate('/projects');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error("Impossible de créer le projet. Veuillez réessayer.");
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        const updatedProject = await projectService.updateProject(id, {
          ...data,
          startDate: data.startDate || data.start_date,
          endDate: data.endDate || data.end_date,
          status: data.status || 'draft',
          progress: data.progress || 0,
          estimatedCost: data.budget || 0
        } as any);
        return updatedProject;
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully.');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error("Failed to update project.");
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await projectService.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted.');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error("Failed to delete project.");
    }
  });

  // UI helper functions
  const getProjectHealth = (project: ProjectData): 'healthy' | 'warning' | 'critical' => {
    const progress = project.progress || 0;
    const budget = project.budget || 0;
    
    if (progress >= 75 && budget > 0) return 'healthy';
    if (progress >= 25) return 'warning';
    return 'critical';
  };

  const getProjectProgress = (project: ProjectData): number => {
    return project.progress || 0;
  };

  const getProjectDuration = (project: ProjectData): string => {
    const start = project.startDate || project.start_date;
    const end = project.endDate || project.end_date;
    if (!start || !end) return 'N/A';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
  };

  const getProjectRisk = (project: ProjectData): 'low' | 'medium' | 'high' => {
    const progress = project.progress || 0;
    const budget = project.budget || 0;
    
    if (progress < 10 && budget > 500000) return 'high';
    if (progress < 50) return 'medium';
    return 'low';
  };

  const getProjectAnalytics = (): ProjectAnalytics => {
    return {
      progress: projects.length > 0 
        ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length 
        : 0,
      budgetUsage: 0,
      riskScore: 0,
      issues: []
    };
  };

  // Validation functions using `any` to avoid strict type mismatch
  const validateFinancialReferential = (project: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!project.budget || project.budget <= 0) {
      errors.push('Project budget must be greater than 0');
    }
    if (!project.financialPlan) {
      warnings.push('Financial plan not specified');
    }
    if (!project.costEstimate && (project.budget || 0) > 100000) {
      warnings.push('Cost estimate recommended for projects over 100,000');
    }
    if (!project.paymentSchedule && (project.budget || 0) > 50000) {
      warnings.push('Payment schedule recommended for projects over 50,000');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'financial' };
  };

  const validateRegulatoryReferential = (project: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!project.permits || project.permits.length === 0) {
      errors.push('Building permits are required');
    }
    if (!project.complianceCode) {
      warnings.push('Compliance code not specified');
    }
    if (!project.regulatoryDocumentation || project.regulatoryDocumentation.length === 0) {
      warnings.push('Regulatory documentation recommended');
    }
    if (!project.safetyRegulations && (project.budget || 0) > 250000) {
      warnings.push('Safety regulations documentation recommended for large projects');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'regulatory' };
  };

  const validateContractualReferential = (project: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!project.contractId) {
      errors.push('Contract reference is required');
    }
    if (!project.clientId) {
      warnings.push('Client information not specified');
    }
    if (!project.contractTerms && (project.budget || 0) > 75000) {
      warnings.push('Contract terms documentation recommended for projects over 75,000');
    }
    if (!project.milestones && (project.budget || 0) > 100000) {
      warnings.push('Project milestones recommended for large projects');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'contractual' };
  };

  const validateQualityReferential = (project: any): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!project.qualityStandards) {
      warnings.push('Quality standards not specified');
    }
    if (!project.qualityControlPlan && (project.budget || 0) > 50000) {
      warnings.push('Quality control plan recommended for projects over 50,000');
    }
    if (!project.inspectionRequirements && (project.budget || 0) > 100000) {
      warnings.push('Inspection requirements recommended for large projects');
    }
    if (!project.qualityAssurance && (project.budget || 0) > 75000) {
      warnings.push('Quality assurance procedures recommended for large projects');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'quality' };
  };

  const generateProjectRecommendations = (project: any, risk: string, health: string): string[] => {
    const recommendations: string[] = [];
    
    if (risk === 'high') {
      recommendations.push('Immediate attention required - high-risk project detected');
      recommendations.push('Consider additional risk mitigation measures');
    } else if (risk === 'medium') {
      recommendations.push('Monitor project closely for timely intervention');
    }
    
    if (health === 'critical') {
      recommendations.push('Project requires immediate intervention');
    } else if (health === 'warning') {
      recommendations.push('Monitor project progress and budget utilization');
    }
    
    const progress = project.progress || 0;
    if (progress < 25) {
      recommendations.push('Project initialization phase - ensure proper planning');
    } else if (progress >= 90) {
      recommendations.push('Project completion phase - prepare for final delivery');
    }
    
    return recommendations;
  };

  return {
    projects,
    isLoading,
    error: error ? error.message : null,
    refetch,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    getProjectHealth,
    getProjectProgress,
    getProjectDuration,
    getProjectRisk,
    getProjectAnalytics,
    validateProjectWithReferential: async (project: ProjectData, referentialType: string): Promise<ValidationResult> => {
      try {
        switch (referentialType) {
          case 'financial':
            return validateFinancialReferential(project);
          case 'regulatory':
            return validateRegulatoryReferential(project);
          case 'contractual':
            return validateContractualReferential(project);
          case 'quality':
            return validateQualityReferential(project);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'], compliance: 'unknown' };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [], compliance: 'error' };
      }
    },
    generateProjectReport: (project: ProjectData): ProjectReport => {
      try {
        const risk = getProjectRisk(project);
        const health = getProjectHealth(project);
        const duration = getProjectDuration(project);
        const analytics = getProjectAnalytics();
        
        return {
          summary: `Project ${project.title} - ${health} health, ${risk} risk, ${duration} duration`,
          details: {
            project: { ...project, risk, health, duration },
            analytics,
            recommendations: generateProjectRecommendations(project, risk, health)
          },
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          summary: 'Error generating report',
          details: {},
          generatedAt: new Date().toISOString()
        };
      }
    }
  };
};
