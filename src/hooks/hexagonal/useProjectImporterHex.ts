/**
 * Hexagonal hook for Project Importer
 * Uses ProjectRepository instead of direct Supabase access
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
      const projectRepo = RepositoryFactory.getProjectRepository();
      const results: any[] = [];

      for (const projectData of projects) {
        try {
          // Check if project already exists
          const existing = await projectRepo.findByTitle(projectData.title);

          if (!existing) {
            const data = await projectRepo.create({
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
            } as any);

            if (data) results.push(data);
          }
        } catch (error) {
          console.error('Error importing project:', projectData.title, error);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
