/**
 * Projects Hook - Enhanced with ProjectDomainTransformer Integration
 * Uses ProjectDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ProjectService } from "@/application/services/ProjectService";
import { ProjectDomainTransformer, CreateProjectRequestDto, UpdateProjectRequestDto } from "@/dtos/transforms";
import { ProjectData } from "@/types/project";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreateProjectDTO = Omit<CreateProjectRequestDto, 'status'> & { status?: any };
type ServiceUpdateProjectDTO = Omit<UpdateProjectRequestDto, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UseProjectsResult {
  projects: ProjectData[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createProject: (data: CreateProjectRequestDto) => void;
  updateProject: ({ id, data }: { id: string; data: UpdateProjectRequestDto }) => void;
  deleteProject: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getProjectHealth: (project: ProjectData) => 'healthy' | 'warning' | 'critical';
  getProjectProgress: (project: ProjectData) => number;
  getProjectDuration: (project: ProjectData) => string;
  getProjectRisk: (project: ProjectData) => 'low' | 'medium' | 'high';
  getProjectAnalytics: () => any;
  validateProjectWithReferential: (project: ProjectData, referentialType: string) => Promise<any>;
  generateProjectReport: (project: ProjectData) => any;
}

/**
 * Enhanced hook for projects management with UI-specific features
 */
export const useProjects = (): UseProjectsResult => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository, ProjectDomainTransformer);

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
    mutationFn: async (projectData: CreateProjectRequestDto) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreateProjectDTO = { ...projectData };
        const createdProject = await projectService.createProject(serviceData as any);
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequestDto }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdateProjectDTO = { ...data };
        const updatedProject = await projectService.updateProject(id, serviceData as any);
        return updatedProject;
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Le projet "${data.title}" a été mis à jour avec succès.`);
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error("Impossible de mettre à jour le projet. Veuillez réessayer.");
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await projectService.deleteProject(id);
        return true;
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Le projet a été supprimé avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error("Impossible de supprimer le projet.");
    }
  });

  // Enhanced UI functions
  const getProjectHealth = (project: ProjectData): 'healthy' | 'warning' | 'critical' => {
    // Calcul simple de santé basé sur la progression et le budget
    const progress = project.progress || 0;
    const budget = project.budget || 0;
    const endDate = project.endDate;
    const now = new Date();
    
    // Timeline health
    let timelineHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (endDate && new Date(endDate) < now) {
      timelineHealth = 'critical';
    } else if (endDate && new Date(endDate).getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      timelineHealth = 'warning';
    }
    
    // Budget health
    let budgetHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (budget > 0) {
      const spent = (progress / 100) * budget;
      const budgetVariance = Math.abs(spent - (budget * 0.8));
      if (budgetVariance > budget * 0.2) {
        budgetHealth = 'critical';
      } else if (budgetVariance > budget * 0.1) {
        budgetHealth = 'warning';
      }
    }
    
    // Overall health
    if (timelineHealth === 'critical' || budgetHealth === 'critical') {
      return 'critical';
    } else if (timelineHealth === 'warning' || budgetHealth === 'warning') {
      return 'warning';
    }
    return 'healthy';
  };

  const getProjectProgress = (project: ProjectData): number => {
    return project.progress || 0;
  };

  const getProjectDuration = (project: ProjectData): string => {
    if (!project.startDate) return 'N/A';
    const start = new Date(project.startDate);
    const end = project.endDate ? new Date(project.endDate) : new Date();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} jours`;
  };

  const getProjectRisk = (project: ProjectData): 'low' | 'medium' | 'high' => {
    // Calcul simple de risque basé sur la santé et la progression
    const health = getProjectHealth(project);
    const progress = project.progress || 0;
    
    if (health === 'critical' || progress < 25) {
      return 'high';
    } else if (health === 'warning' || progress < 50) {
      return 'medium';
    }
    return 'low';
  };

  const getProjectAnalytics = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'en cours').length;
    const completedProjects = projects.filter(p => p.status === 'terminé').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const averageBudget = totalProjects > 0 ? totalBudget / totalProjects : 0;
    
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      averageBudget,
      completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
      budgetUtilization: totalBudget > 0 ? Math.round((projects.reduce((sum, p) => sum + ((p.progress || 0) / 100) * (p.budget || 0), 0) / totalBudget) * 100) : 0
    };
  };

  // Validation functions for different referential types
  const validateFinancialReferential = (project: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate budget
    if (!project.budget || project.budget <= 0) {
      errors.push('Project budget must be greater than 0');
    }
    
    // Validate financial planning
    if (!project.financialPlan) {
      warnings.push('Financial plan not specified');
    }
    
    // Validate cost estimates
    if (!project.costEstimate && project.budget > 100000) {
      warnings.push('Cost estimate recommended for projects over 100,000');
    }
    
    // Validate payment schedule
    if (!project.paymentSchedule && project.budget > 50000) {
      warnings.push('Payment schedule recommended for projects over 50,000');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'financial'
    };
  };

  const validateRegulatoryReferential = (project: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate permits
    if (!project.permits || project.permits.length === 0) {
      errors.push('Building permits are required');
    }
    
    // Validate compliance codes
    if (!project.complianceCode) {
      warnings.push('Compliance code not specified');
    }
    
    // Validate regulatory documentation
    if (!project.regulatoryDocumentation || project.regulatoryDocumentation.length === 0) {
      warnings.push('Regulatory documentation recommended');
    }
    
    // Validate safety regulations
    if (!project.safetyRegulations && project.budget > 250000) {
      warnings.push('Safety regulations documentation recommended for large projects');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'regulatory'
    };
  };

  const validateContractualReferential = (project: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate contract reference
    if (!project.contractId) {
      errors.push('Contract reference is required');
    }
    
    // Validate client information
    if (!project.clientId) {
      warnings.push('Client information not specified');
    }
    
    // Validate contract terms
    if (!project.contractTerms && project.budget > 75000) {
      warnings.push('Contract terms documentation recommended for projects over 75,000');
    }
    
    // Validate milestones
    if (!project.milestones && project.budget > 100000) {
      warnings.push('Project milestones recommended for large projects');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'contractual'
    };
  };

  const validateQualityReferential = (project: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate quality standards
    if (!project.qualityStandards) {
      warnings.push('Quality standards not specified');
    }
    
    // Validate quality control plan
    if (!project.qualityControlPlan && project.budget > 50000) {
      warnings.push('Quality control plan recommended for projects over 50,000');
    }
    
    // Validate inspection requirements
    if (!project.inspectionRequirements && project.budget > 100000) {
      warnings.push('Inspection requirements recommended for large projects');
    }
    
    // Validate quality assurance
    if (!project.qualityAssurance && project.budget > 75000) {
      warnings.push('Quality assurance procedures recommended for large projects');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'quality'
    };
  };

  // Generate project recommendations based on analysis
  const generateProjectRecommendations = (project: any, risk: string, health: string) => {
    const recommendations: string[] = [];
    
    // Risk-based recommendations
    if (risk === 'high') {
      recommendations.push('Immediate attention required - high-risk project detected');
      recommendations.push('Consider additional risk mitigation measures');
      recommendations.push('Implement enhanced monitoring procedures');
    } else if (risk === 'medium') {
      recommendations.push('Monitor project closely for timely intervention');
      recommendations.push('Review project timeline and budget');
    }
    
    // Health-based recommendations
    if (health === 'critical') {
      recommendations.push('Project requires immediate intervention');
      recommendations.push('Review project timeline and budget allocation');
      recommendations.push('Consider project restructuring');
    } else if (health === 'warning') {
      recommendations.push('Monitor project progress and budget utilization');
      recommendations.push('Review project timeline and milestones');
    }
    
    // Progress-based recommendations
    const progress = project.progress || 0;
    if (progress < 25) {
      recommendations.push('Project initialization phase - ensure proper planning');
      recommendations.push('Review resource allocation and timeline');
    } else if (progress > 75 && progress < 90) {
      recommendations.push('Project nearing completion - focus on deliverables');
      recommendations.push('Plan for project closure and handover');
    } else if (progress >= 90) {
      recommendations.push('Project completion phase - prepare for final delivery');
      recommendations.push('Schedule project review and lessons learned');
    }
    
    // Budget-based recommendations
    const budget = project.budget || 0;
    const spent = (progress / 100) * budget;
    if (spent > budget * 0.9) {
      recommendations.push('Budget utilization high - monitor remaining expenses');
    } else if (spent < budget * 0.3 && progress > 50) {
      recommendations.push('Budget utilization low - review spending patterns');
    }
    
    return recommendations;
  };

  return {
    projects,
    isLoading,
    error,
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
    validateProjectWithReferential: async (project: ProjectData, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
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
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateProjectReport: (project: ProjectData) => {
      try {
        const risk = getProjectRisk(project);
        const health = getProjectHealth(project);
        const duration = getProjectDuration(project);
        const analytics = getProjectAnalytics();
        
        return {
          project: {
            ...project,
            risk,
            health,
            duration,
            progress: project.progress || 0,
            budgetUtilization: project.budget ? ((project.progress || 0) / 100) * 100 : 0
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Project Analysis Report',
          summary: {
            totalProjects: analytics.totalProjects,
            activeProjects: analytics.activeProjects,
            completionRate: analytics.completionRate,
            budgetUtilization: analytics.budgetUtilization
          },
          recommendations: generateProjectRecommendations(project, risk, health),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'ProjectSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          project, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
};
