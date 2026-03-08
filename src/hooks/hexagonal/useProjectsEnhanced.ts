/**
 * Enhanced Hook for Projects Management with Rich UI Features
 * Uses ProjectService with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";
import { ProjectService } from "@/application/services/ProjectService";
import { ProjectDTO, CreateProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';

// Enhanced types for UI components
export interface UseProjectsEnhancedResult {
  projects: ProjectDTO[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  createProject: (data: CreateProjectDTO) => void;
  updateProject: ({ id, data }: { id: string; data: UpdateProjectDTO }) => void;
  deleteProject: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getProjectHealth: (project: ProjectDTO) => 'healthy' | 'warning' | 'critical';
  getProjectProgress: (project: ProjectDTO) => number;
  getProjectDuration: (project: ProjectDTO) => string;
  getProjectEfficiency: (project: ProjectDTO) => number;
  getProjectRisk: (project: ProjectDTO) => 'low' | 'medium' | 'high';
  getOverdueProjects: () => ProjectDTO[];
  getHighRiskProjects: () => ProjectDTO[];
  getProjectsByStatus: (status: string) => ProjectDTO[];
  calculateTotalBudget: () => number;
  calculateTotalProgress: () => number;
  getProjectsByProgressRange: (min: number, max: number) => ProjectDTO[];
}

// Helper functions for project calculations
function getProjectHealthStatus(project: ProjectDTO): 'healthy' | 'warning' | 'critical' {
  if (project.progress >= 80 && project.status !== 'en_retard' && project.status !== 'suspendu') return 'healthy';
  if (project.progress >= 40) return 'warning';
  return 'critical';
}

function calculateProjectRisk(project: ProjectDTO): 'low' | 'medium' | 'high' {
  const isOverdue = project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed';
  const lowProgress = project.progress < 30;
  if (isOverdue && lowProgress) return 'high';
  if (isOverdue || lowProgress) return 'medium';
  return 'low';
}

function formatProjectDuration(startDate?: string, endDate?: string): string {
  if (!startDate) return 'N/A';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} jours`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return `${(days / 365).toFixed(1)} ans`;
}

function calculateProjectEfficiency(project: ProjectDTO): number {
  if (!project.startDate || !project.endDate) return 0;
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const now = new Date();
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
  return expectedProgress > 0 ? (project.progress / expectedProgress) * 100 : 0;
}

/**
 * Enhanced hook for projects management with UI-specific features
 */
export function useProjectsEnhanced(): UseProjectsEnhancedResult {
  const queryClient = useQueryClient();
  
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
    queryFn: async (): Promise<ProjectDTO[]> => {
      return await projectService.getAllProjects();
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectDTO): Promise<ProjectDTO> => {
      return await projectService.createProject(data);
    },
    onSuccess: () => {
      toast.success('Projet créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      console.error('Create project error:', error);
      toast.error('Erreur lors de la création du projet');
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectDTO }): Promise<ProjectDTO> => {
      return await projectService.updateProject(id, data);
    },
    onSuccess: () => {
      toast.success('Projet mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      console.error('Update project error:', error);
      toast.error('Erreur lors de la mise à jour du projet');
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await projectService.deleteProject(id);
    },
    onSuccess: () => {
      toast.success('Projet supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: Error) => {
      console.error('Delete project error:', error);
      toast.error('Erreur lors de la suppression du projet');
    }
  });

  // Enhanced UI methods
  const getProjectHealth = (project: ProjectDTO): 'healthy' | 'warning' | 'critical' => {
    return getProjectHealthStatus(project);
  };

  const getProjectProgress = (project: ProjectDTO): number => {
    return project.progress || 0;
  };

  const getProjectDuration = (project: ProjectDTO): string => {
    return formatProjectDuration(project.startDate, project.endDate);
  };

  const getProjectEfficiency = (project: ProjectDTO): number => {
    return calculateProjectEfficiency(project);
  };

  const getProjectRisk = (project: ProjectDTO): 'low' | 'medium' | 'high' => {
    return calculateProjectRisk(project);
  };

  const getOverdueProjects = (): ProjectDTO[] => {
    return projects.filter(project => {
      if (!project.endDate) return false;
      return new Date(project.endDate) < new Date() && project.status !== 'completed';
    });
  };

  const getHighRiskProjects = (): ProjectDTO[] => {
    return projects.filter(project => 
      calculateProjectRisk(project) === 'high'
    );
  };

  const getProjectsByStatus = (status: string): ProjectDTO[] => {
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

  const getProjectsByProgressRange = (min: number, max: number): ProjectDTO[] => {
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
    const totalProgress = projects.reduce((sum, p) => sum + p.progress, 0) / (projects.length || 1);
    const overdueCount = projects.filter(p => {
      if (!p.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'completed';
    }).length;
    const highRiskCount = projects.filter(p => 
      calculateProjectRisk(p) === 'high'
    ).length;
    
    const healthyCount = projects.filter(p => 
      getProjectHealthStatus(p) === 'healthy'
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