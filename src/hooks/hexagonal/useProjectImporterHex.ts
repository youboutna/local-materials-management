/**
 * Hexagonal hook for Project Importer
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectImportData {
  project_order: number;
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
  financing_source: string;
  market_type: string;
  selection_mode: string;
  launch_date: string;
  attribution_date: string;
  completion_date: string;
}

export function useImportProjectsHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projects: ProjectImportData[]) => {
      const results: any[] = [];

      for (const project of projects) {
        // Check if project already exists
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('title', project.title as any)
          .maybeSingle();

        if (!existing) {
          const { data, error } = await supabase
            .from('projects')
            .insert(project as any)
            .select()
            .single();

          if (error) throw error;
          if (data) results.push(data);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
