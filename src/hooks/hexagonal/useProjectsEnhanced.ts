/**
 * Enhanced Hook for Projects Management with Rich UI Features
 * Uses ProjectDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ProjectService } from "@/application/services/ProjectService";
import { ProjectDomainTransformer, ProjectResponseDto, CreateProjectRequestDto, UpdateProjectRequestDto } from "@/dtos/transforms";

// Enhanced types for UI components
export interface UseProjectsEnhancedResult {
  projects: ProjectResponseDto[];
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
  getProjectHealth: (project: ProjectResponseDto) => 'healthy' | 'warning' | 'critical';
  getProjectProgress: (project: ProjectResponseDto) => number;
  getProjectDuration: (project: ProjectResponseDto) => string;
  getProjectEfficiency: (project: ProjectResponseDto) => number;
  getProjectRisk: (project: ProjectResponseDto) => 'low' | 'medium' | 'high';
  getOverdueProjects: () => ProjectResponseDto[];
  getHighRiskProjects: () => ProjectResponseDto[];
  getProjectsByStatus: (status: string) => ProjectResponseDto[];
  calculateTotalBudget: () => number;
  calculateTotalProgress: () => number;
  getProjectsByProgressRange: (min: number, max: number) => ProjectResponseDto[];
}

/**
 * Enhanced hook for projects management with UI-specific features
 */
export function useProjectsEnhanced(): UseProjectsEnhancedResult {
  const queryClient = useQueryClient();
  
  const projectRepository = RepositoryFactory.getProjectRepository();
  const projectService = new ProjectService(projectRepository);
  const projectTransformer = new ProjectDomainTransformer();

  // Query for projects list
  const {
    data: projects = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectResponseDto[]> => {
      try {
        const projectEntities = await projectService.getAllProjects();
        return projectTransformer.fromDtosToAdapter(
          projectEntities.map(entity => projectTransformer.toDTO(entity))
        );
      } catch (err) {
        console.error('Error fetching projects:', err);
        throw err;
      }
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectRequestDto): Promise<ProjectResponseDto> => {
      try {
        const projectDTO = projectTransformer.toRequestDto(data);
        const projectEntity = projectService.createProject(projectDTO);
        return projectTransformer.fromDomainToResponseDto(projectEntity);
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Projet créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      console.error('Create project error:', error);
      toast.error('Erreur lors de la création du projet');
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectRequestDto }): Promise<ProjectResponseDto> => {
      try {
        const projectDTO = projectTransformer.toUpdateDto(data);
        const projectEntity = await projectService.updateProject(id, projectDTO);
        return projectTransformer.fromDomainToResponseDto(projectEntity);
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Projet mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      console.error('Update project error:', error);
      toast.error('Erreur lors de la mise à jour du projet');
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        await projectService.deleteProject(id);
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Projet supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      console.error('Delete project error:', error);
      toast.error('Erreur lors de la suppression du projet');
    }
  });

  // Enhanced UI methods
  const getProjectHealth = (project: ProjectResponseDto): 'healthy' | 'warning' | 'critical' => {
    return ProjectDomainTransformer.getProjectHealthStatus(project);
  };

  const getProjectProgress = (project: ProjectResponseDto): number => {
    return ProjectDomainTransformer.calculateProjectProgress(project);
  };

  const getProjectDuration = (project: ProjectResponseDto): string => {
    return ProjectDomainTransformer.formatProjectDuration(project.startDate, project.endDate);
  };

  const getProjectEfficiency = (project: ProjectResponseDto): number => {
    return ProjectDomainTransformer.calculateProjectEfficiency(project);
  };

  const getProjectRisk = (project: ProjectResponseDto): 'low' | 'medium' | 'high' => {
    return ProjectDomainTransformer.calculateProjectRisk(project);
  };

  const getOverdueProjects = (): ProjectResponseDto[] => {
    return projects.filter(project => {
      if (!project.endDate) return false;
      return new Date(project.endDate) < new Date() && project.status !== 'completed';
    });
  };

  const getHighRiskProjects = (): ProjectResponseDto[] => {
    return projects.filter(project => 
      ProjectDomainTransformer.calculateProjectRisk(project) === 'high'
    );
  };

  const getProjectsByStatus = (status: string): ProjectResponseDto[] => {
    return projects.filter(project => project.status === status);
  };

  const calculateTotalBudget = (): number => {
    return projects.reduce((total, project) => total + project.budget, 0);
  };

  const calculateTotalProgress = (): number => {
    if (projects.length === 0) return 0;
    const totalProgress = projects.reduce((total, project) => total + project.progress, 0);
    return totalProgress / projects.length;
  };

  const getProjectsByProgressRange = (min: number, max: number): ProjectResponseDto[] => {
    return projects.filter(project => 
      project.progress >= min && project.progress <= max
    );
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
    // Enhanced UI features
    getProjectHealth,
    getProjectProgress,
    getProjectDuration,
    getProjectEfficiency,
    getProjectRisk,
    getOverdueProjects,
    getHighRiskProjects,
    getProjectsByStatus,
    calculateTotalBudget,
    calculateTotalProgress,
    getProjectsByProgressRange
  };
}

/**
 * Hook for project calculations and analytics
 */
export function useProjectCalculations() {
  const { projects } = useProjectsEnhanced();

  const getProjectStats = () => {
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length;
    const overdueCount = projects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'completed';
    }).length;
    const highRiskCount = projects.filter(p => 
      ProjectDomainTransformer.calculateProjectRisk(p) === 'high'
    ).length;
    
    const healthyCount = projects.filter(p => 
      ProjectDomainTransformer.getProjectHealthStatus(p) === 'healthy'
    ).length;
    
    return {
      totalProjects: projects.length,
      totalBudget,
      averageProgress: totalProgress,
      overdueCount,
      highRiskCount,
      healthyCount,
      atRiskCount: projects.length - healthyCount
    };
  };

  const getStatusBreakdown = () => {
    const statusBreakdown: Record<string, number> = {};
    
    projects.forEach(project => {
      const status = project.status;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    
    return statusBreakdown;
  };

  const getBudgetDistribution = () => {
    const ranges = [
      { label: '< 50k', min: 0, max: 50000 },
      { label: '50k-100k', min: 50000, max: 100000 },
      { label: '100k-500k', min: 100000, max: 500000 },
      { label: '500k-1M', min: 500000, max: 1000000 },
      { label: '> 1M', min: 1000000, max: Infinity }
    ];
    
    return ranges.map(range => ({
      label: range.label,
      count: projects.filter(p => p.budget >= range.min && p.budget < range.max).length
    }));
  };

  const getProgressDistribution = () => {
    const ranges = [
      { label: '0-25%', min: 0, max: 25 },
      { label: '25-50%', min: 25, max: 50 },
      { label: '50-75%', min: 50, max: 75 },
      { label: '75-100%', min: 75, max: 100 }
    ];
    
    return ranges.map(range => ({
      label: range.label,
      count: projects.filter(p => p.progress >= range.min && p.progress < range.max).length
    }));
  };

  return {
    getProjectStats,
    getStatusBreakdown,
    getBudgetDistribution,
    getProgressDistribution
  };
}
