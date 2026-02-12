/**
 * Hexagonal hooks for Tender Project Structure
 * Uses RepositoryFactory instead of direct Supabase access
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface Step {
  id: string;
  name: string;
  status: string;
  progress: number;
  order_index: number;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  start_date?: string;
  end_date?: string;
  budget?: number;
  steps?: Step[];
}

export interface ProjectDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  budget?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  phases: Phase[];
}

export function useProjectStructureHex(projectId: string) {
  return useQuery({
    queryKey: ['project-structure', projectId],
    queryFn: async (): Promise<ProjectDetails | null> => {
      const projectRepo = RepositoryFactory.getProjectRepository();
      const phaseRepo = RepositoryFactory.getPhaseRepository();

      // Fetch project details
      const projectData = await projectRepo.findById(projectId);
      if (!projectData) return null;

      // Fetch phases
      const phasesData = await phaseRepo.findByProject(projectId);

      const phases: Phase[] = (phasesData || []).map((phase: any) => ({
        id: phase.id,
        name: phase.phase_name || phase.phaseName || phase.name,
        description: phase.description,
        status: phase.status,
        progress: phase.progress || 0,
        start_date: phase.start_date || phase.startDate,
        end_date: phase.end_date || phase.endDate,
        budget: phase.budget_allocated || phase.budgetAllocated,
        steps: (phase.phase_steps || phase.steps || [])
          .sort((a: any, b: any) => (a.step_order || a.orderIndex || 0) - (b.step_order || b.orderIndex || 0))
          .map((step: any) => ({
            id: step.id,
            name: step.step_name || step.stepName || step.name,
            status: step.status || 'pending',
            progress: step.progress || 0,
            order_index: step.step_order || step.orderIndex || 0
          }))
      }));

      return {
        id: projectData.id,
        title: (projectData as any).title,
        description: (projectData as any).description || undefined,
        status: (projectData as any).status || 'en attente',
        progress: (projectData as any).progress || 0,
        budget: (projectData as any).budget || undefined,
        location: (projectData as any).location || undefined,
        start_date: (projectData as any).start_date || (projectData as any).startDate || undefined,
        end_date: (projectData as any).end_date || (projectData as any).endDate || undefined,
        phases
      };
    },
    enabled: !!projectId
  });
}
