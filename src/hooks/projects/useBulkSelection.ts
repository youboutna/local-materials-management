import { useState, useCallback } from "react";
import { ProjectData } from "@/types/project";
import { toast } from "sonner";

interface UseBulkSelectionReturn {
  selectedProjects: Set<string>;
  toggleProjectSelection: (projectId: string) => void;
  selectAllOnPage: (projectIds: string[]) => void;
  deselectAllOnPage: (projectIds: string[]) => void;
  selectAll: (projectIds: string[]) => void;
  clearSelection: () => void;
  isProjectSelected: (projectId: string) => boolean;
  getSelectedProjects: (projects: ProjectData[]) => ProjectData[];
  getSelectedProjectsCount: () => number;
  bulkUpdateProjects: (
    projectIds: string[],
    updates: Partial<ProjectData>
  ) => Promise<void>;
  selectProjectsByFilter: (
    filterFn: (project: ProjectData) => boolean,
    projects: ProjectData[]
  ) => void;
}

export const useBulkSelection = (): UseBulkSelectionReturn => {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const selectAllOnPage = useCallback((projectIds: string[]) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      projectIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  }, []);

  const deselectAllOnPage = useCallback((projectIds: string[]) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      projectIds.forEach((id) => newSet.delete(id));
      return newSet;
    });
  }, []);

  const selectAll = useCallback((projectIds: string[]) => {
    setSelectedProjects(new Set(projectIds));
    toast.success(`${projectIds.length} projet(s) sélectionné(s)`);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProjects(new Set());
  }, []);

  const isProjectSelected = useCallback(
    (projectId: string) => {
      return selectedProjects.has(projectId);
    },
    [selectedProjects]
  );

  const getSelectedProjects = useCallback(
    (projects: ProjectData[]): ProjectData[] => {
      return projects.filter((project) => selectedProjects.has(project.id));
    },
    [selectedProjects]
  );

  const getSelectedProjectsCount = useCallback(() => {
    return selectedProjects.size;
  }, [selectedProjects]);

  const bulkUpdateProjects = useCallback(
    async (projectIds: string[], updates: Partial<ProjectData>) => {
      try {
        // Here you would call your API to update multiple projects
        console.log("Updating projects:", projectIds, "with:", updates);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // In a real app, you would update the projects in your state/backend
        toast.success(`${projectIds.length} projet(s) mis à jour`);
      } catch (error) {
        console.error("Error updating projects:", error);
        throw error;
      }
    },
    []
  );

  const selectProjectsByFilter = useCallback(
    (filterFn: (project: ProjectData) => boolean, projects: ProjectData[]) => {
      const filteredIds = projects.filter(filterFn).map((p) => p.id);
      setSelectedProjects(new Set(filteredIds));
      toast.success(
        `${filteredIds.length} projet(s) sélectionné(s) par filtre`
      );
    },
    []
  );

  return {
    selectedProjects,
    toggleProjectSelection,
    selectAllOnPage,
    deselectAllOnPage,
    selectAll,
    clearSelection,
    isProjectSelected,
    getSelectedProjects,
    getSelectedProjectsCount,
    bulkUpdateProjects,
    selectProjectsByFilter,
  };
};
