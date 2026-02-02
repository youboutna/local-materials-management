/**
 * Hexagonal hooks for Tender Project Structure
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

interface PhaseDTO {
  id: string;
  phase_name?: string;
  name?: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget_allocated?: number;
  phase_steps?: PhaseStepDTO[];
}

interface PhaseStepDTO {
  id: string;
  step_name?: string;
  name?: string;
  status: string;
  step_order?: number;
}

export function useProjectStructureHex(projectId: string) {
  return useQuery({
    queryKey: ['project-structure', projectId],
    queryFn: async (): Promise<ProjectDetails | null> => {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch phases with steps
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select(`
          *,
          phase_steps (*)
        `)
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (phasesError) throw phasesError;

      // Map phases with steps
      const phases: Phase[] = (phasesData || []).map((phase: PhaseDTO) => ({
        id: phase.id,
        name: phase.phase_name || phase.name,
        description: phase.description,
        status: phase.status,
        start_date: phase.start_date,
        end_date: phase.end_date,
        budget: phase.budget_allocated,
        steps: (phase.phase_steps || [])
          .sort((a: PhaseStepDTO, b: PhaseStepDTO) => (a.step_order || 0) - (b.step_order || 0))
          .map((step: PhaseStepDTO) => ({
            id: step.id,
            name: step.step_name || step.name,
            status: step.status || 'pending',
            order_index: step.step_order || 0
          }))
      }));

      return {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description || undefined,
        status: projectData.status || 'en attente',
        progress: projectData.progress || 0,
        budget: projectData.budget || undefined,
        location: projectData.location || undefined,
        start_date: projectData.start_date || undefined,
        end_date: projectData.end_date || undefined,
        phases
      };
    },
    enabled: !!projectId
  });
}
