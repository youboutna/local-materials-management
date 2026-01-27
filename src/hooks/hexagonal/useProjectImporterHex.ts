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

      for (const projectData of projects) {
        try {
          // Check if project already exists
          const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('title', projectData.title)
            .maybeSingle();

          if (!existing) {
            const { data, error } = await supabase
              .from('projects')
              .insert({
                title: projectData.title,
                description: projectData.description,
                location: projectData.location,
                status: projectData.status,
                progress: projectData.progress,
                budget: projectData.budget,
                start_date: projectData.start_date,
                end_date: projectData.end_date,
                team_size: projectData.team_size,
                financing_source: projectData.financing_source,
                market_type: projectData.market_type,
                selection_mode: projectData.selection_mode,
                launch_date: projectData.launch_date,
                attribution_date: projectData.attribution_date,
                completion_date: projectData.completion_date,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (error) throw error;
            if (data) results.push(data);
          }
        } catch (error) {
          console.error('Error importing project:', projectData.title, error);
          // Continue with other projects even if one fails
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
