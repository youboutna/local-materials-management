/**
 * Hook Refactorisé pour ProjectDetailByDTO
 * Utilise l'architecture hexagonale complète
 * Élimine tous les appels directs aux services
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { useProjectPhasesHex } from '@/hooks/hexagonal/useProjectsHex';

// Types pour le composant
interface ProjectDetailByDTOProps {
  projectId?: string;
  onEdit?: () => void;
  onClose?: () => void;
}

export function useProjectDetail(projectId: string | null) {
  const queryClient = useQueryClient();
  
  // Utiliser le hook hexagonal pour les projets
  const { projects } = useProjectsHex();
  const project = projects.find(p => p.id === projectId);
  
  // Utiliser le hook hexagonal pour les phases
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

export function useProjectAnalytics(projectId: string | null, projectDetail: any) {
  // Simulation pour l'instant - à remplacer par le vrai hook
  return {
    analytics: null,
    kpiMetrics: null,
    complianceData: null,
    isLoading: false,
    error: null,
    refetch: () => {}
  };
}

export function useMilestones(projectId: string | null) {
  // Simulation pour l'instant - à remplacer par le vrai hook
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
