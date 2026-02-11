import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

import { 
  ProjectManagementService, 
  ProjectOverviewDTO, 
  ProjectDetailDTO, 
  ProjectMetricsDTO, 
  ProjectFilterDTO, 
  ProjectActionDTO,
  ProjectWorkflowDTO 
} from '@/application/services/ProjectManagementService';

import { 
  ProjectDTO, 
  CreateProjectDTO, 
  UpdateProjectDTO, 
  ProjectStatus 
} from '@/dtos/entities/ProjectDTO';

// Query keys
export const PROJECT_KEYS = {
  all: ['projects'] as const,
  lists: () => [...PROJECT_KEYS.all, 'list'] as const,
  list: (filters: ProjectFilterDTO) => [...PROJECT_KEYS.lists(), filters] as const,
  details: () => [...PROJECT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROJECT_KEYS.details(), id] as const,
  overview: (id: string) => [...PROJECT_KEYS.all, 'overview', id] as const,
  metrics: () => [...PROJECT_KEYS.all, 'metrics'] as const,
  workflow: (id: string) => [...PROJECT_KEYS.all, 'workflow', id] as const,
};

/**
 * Hook for getting all projects with filtering
 */
export function useProjects(filters?: ProjectFilterDTO) {
  return useQuery({
    queryKey: PROJECT_KEYS.list(filters || {}),
    queryFn: () => projectManagementService.getAllProjects(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting project overview
 */
export function useProjectOverview(projectId: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.overview(projectId),
    queryFn: () => projectManagementService.getProjectOverview(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for getting detailed project information
 */
export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(projectId),
    queryFn: () => projectManagementService.getProjectDetails(projectId),
    enabled: !!projectId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for getting project metrics
 */
export function useProjectMetrics() {
  return useQuery({
    queryKey: PROJECT_KEYS.metrics(),
    queryFn: () => projectManagementService.getProjectMetrics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook for getting project workflow
 */
export function useProjectWorkflow(projectId: string) {
  return useQuery({
    queryKey: PROJECT_KEYS.workflow(projectId),
    queryFn: () => projectManagementService.getProjectWorkflow(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for creating a project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectDTO) => projectManagementService.createProject(data),
    onSuccess: (project) => {
      toast({
        title: "Project Created",
        description: `Project "${project.title}" has been created successfully.`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.metrics() });
      
      return project;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for updating a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: UpdateProjectDTO }) =>
      projectManagementService.updateProject(projectId, data),
    onSuccess: (project, variables) => {
      toast({
        title: "Project Updated",
        description: `Project "${project.title}" has been updated successfully.`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.overview(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.metrics() });
      
      return project;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for deleting a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => {
      const action: ProjectActionDTO = {
        type: 'delete',
        projectId,
        userId: 'current-user' // This should come from auth context
      };
      return projectManagementService.executeProjectAction(action);
    },
    onSuccess: (_, projectId) => {
      toast({
        title: "Project Deleted",
        description: "Project has been deleted successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.metrics() });
      
      // Remove specific project from cache
      queryClient.removeQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      queryClient.removeQueries({ queryKey: PROJECT_KEYS.overview(projectId) });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for archiving a project
 */
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => {
      const action: ProjectActionDTO = {
        type: 'archive',
        projectId,
        userId: 'current-user' // This should come from auth context
      };
      return projectManagementService.executeProjectAction(action);
    },
    onSuccess: (_, projectId) => {
      toast({
        title: "Project Archived",
        description: "Project has been archived successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.overview(projectId) });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive project",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for restoring a project
 */
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => {
      const action: ProjectActionDTO = {
        type: 'restore',
        projectId,
        userId: 'current-user' // This should come from auth context
      };
      return projectManagementService.executeProjectAction(action);
    },
    onSuccess: (_, projectId) => {
      toast({
        title: "Project Restored",
        description: "Project has been restored successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.overview(projectId) });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore project",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for updating project status
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, status, reason }: { 
      projectId: string; 
      status: ProjectStatus; 
      reason?: string;
    }) => {
      const action: ProjectActionDTO = {
        type: 'update',
        projectId,
        data: { status },
        reason,
        userId: 'current-user' // This should come from auth context
      };
      return projectManagementService.executeProjectAction(action);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Status Updated",
        description: `Project status has been updated successfully.`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.overview(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.workflow(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.metrics() });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project status",
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for bulk project operations
 */
export function useBulkProjectOperations() {
  const queryClient = useQueryClient();

  const bulkUpdateStatus = useMutation({
    mutationFn: ({ projectIds, status, reason }: {
      projectIds: string[];
      status: ProjectStatus;
      reason?: string;
    }) => {
      return Promise.all(
        projectIds.map(projectId => {
          const action: ProjectActionDTO = {
            type: 'update',
            projectId,
            data: { status },
            reason,
            userId: 'current-user'
          };
          return projectManagementService.executeProjectAction(action);
        })
      );
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Bulk Update Completed",
        description: `${variables.projectIds.length} projects have been updated.`,
      });
      
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update projects",
        variant: "destructive",
      });
    },
  });

  const bulkArchive = useMutation({
    mutationFn: (projectIds: string[]) => {
      return Promise.all(
        projectIds.map(projectId => {
          const action: ProjectActionDTO = {
            type: 'archive',
            projectId,
            userId: 'current-user'
          };
          return projectManagementService.executeProjectAction(action);
        })
      );
    },
    onSuccess: (_, projectIds) => {
      toast({
        title: "Bulk Archive Completed",
        description: `${projectIds.length} projects have been archived.`,
      });
      
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive projects",
        variant: "destructive",
      });
    },
  });

  return {
    bulkUpdateStatus,
    bulkArchive
  };
}

/**
 * Hook for project search and filtering
 */
export function useProjectSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProjectFilterDTO>({});

  const { data: projects, isLoading } = useProjects(filters);

  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    
    if (!searchTerm) return projects;

    return projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  const updateFilters = React.useCallback((newFilters: Partial<ProjectFilterDTO>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = React.useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  return {
    projects: filteredProjects,
    isLoading,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilters,
    clearFilters
  };
}

/**
 * Hook for project statistics and analytics
 */
export function useProjectStatistics() {
  const { data: metrics } = useProjectMetrics();
  const { data: projects } = useProjects();

  return React.useMemo(() => {
    if (!metrics || !projects) return null;

    const statusTrends = Object.entries(metrics.statusDistribution).map(([status, count]) => ({
      status,
      count,
      percentage: (count / metrics.totalProjects) * 100
    }));

    const budgetAnalysis = {
      total: metrics.totalBudget,
      spent: metrics.spentBudget,
      remaining: metrics.totalBudget - metrics.spentBudget,
      utilization: metrics.budgetUtilization
    };

    const performanceMetrics = {
      averageProgress: metrics.averageProgress,
      onTimeDelivery: metrics.onTimeDelivery,
      qualityScore: metrics.qualityScore,
      healthScore: Math.round(
        (metrics.averageProgress + metrics.onTimeDelivery + metrics.qualityScore) / 3
      )
    };

    return {
      metrics,
      statusTrends,
      budgetAnalysis,
      performanceMetrics
    };
  }, [metrics, projects]);
}

/**
 * Hook for project workflow management
 */
export function useProjectWorkflowManager(projectId: string) {
  const { data: workflow, isLoading } = useProjectWorkflow(projectId);
  const updateStatus = useUpdateProjectStatus();

  const advanceWorkflow = React.useCallback(async () => {
    if (!workflow) return;

    // This would contain logic to advance to next workflow step
    const nextStep = workflow.currentStep + 1;
    if (nextStep <= workflow.totalSteps) {
      // Update project status based on workflow step
      // This is a simplified example - actual implementation would be more complex
      await updateStatus.mutateAsync({
        projectId,
        status: ProjectStatus.EN_COURS,
        reason: 'Workflow advanced to next step'
      });
    }
  }, [workflow, projectId, updateStatus]);

  const blockWorkflow = React.useCallback(async (reason: string) => {
    // This would contain logic to block workflow
    await updateStatus.mutateAsync({
      projectId,
      status: ProjectStatus.SUSPENDU,
      reason
    });
  }, [projectId, updateStatus]);

  return {
    workflow,
    isLoading,
    advanceWorkflow,
    blockWorkflow
  };
}
