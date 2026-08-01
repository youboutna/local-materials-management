/**
 * Hexagonal hook for Project Importer
 * Uses ProjectRepository instead of direct Supabase access
 */

import { ProjectImportExportService } from '@/application/services/ProjectImportExportService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const service = ProjectImportExportService.default();

  return useMutation({
    mutationFn: async (projects: ProjectImportData[]) => {
      const result = await service.importProjects(projects.map((project) => ({
        id: project.project_order ? String(project.project_order) : undefined,
        title: project.title,
        description: project.description,
        location: project.location,
        status: project.status,
        progress: project.progress,
        budget: project.budget,
        startDate: project.start_date,
        endDate: project.end_date,
        teamSize: project.team_size,
        financingSource: project.financing_source,
        marketType: project.market_type,
        selectionMode: project.selection_mode,
        launchDate: project.launch_date,
        attributionDate: project.attribution_date,
        completionDate: project.completion_date,
      })));
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}
