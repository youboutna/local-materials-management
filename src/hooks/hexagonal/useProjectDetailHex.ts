/**
 * Hook Refactorisé pour ProjectDetailByDTO
 * Utilise l'architecture hexagonale complète
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProjectsHex } from '@/hooks/hexagonal'
import { useProjectPhasesHex } from '@/hooks/hexagonal';

interface ProjectDetailByDTOProps {
  projectId?: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function useProjectDetail(projectId: string | undefined) {
  const queryClient = useQueryClient();
  
  const { projects } = useProjectsHex();
  const project = projects.find(p => p.id === projectId);
  
  const { phases: projectPhases } = useProjectPhasesHex(projectId);
  
  return {
    project,
    projectPhases,
    isLoading: false,
    error: null,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  };
}

export function useProjectAnalytics(projectId: string | undefined, projectDetail: any) {
  return {
    analytics: null,
    kpiMetrics: null,
    complianceData: null,
    isLoading: false,
    error: null,
    refetch: () => {}
  };
}

export function useMilestones(projectId: string | undefined) {
  return {
    milestoneProgress: null,
    isLoading: false,
    error: null,
    refetch: () => {}
  };
}

export function useToastNotifications() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    warning: (message: string) => toast.warning(message),
  };
}
