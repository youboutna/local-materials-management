import { useState, useCallback } from "react";

export const useBulkSelection = () => {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(projectId)) {
        newSelection.delete(projectId);
      } else {
        newSelection.add(projectId);
      }
      return newSelection;
    });
  }, []);

  const selectAllOnPage = useCallback((projectIds: string[]) => {
    setSelectedProjects((prev) => {
      const newSelection = new Set(prev);
      projectIds.forEach((id) => newSelection.add(id));
      return newSelection;
    });
  }, []);

  const deselectAllOnPage = useCallback((projectIds: string[]) => {
    setSelectedProjects((prev) => {
      const newSelection = new Set(prev);
      projectIds.forEach((id) => newSelection.delete(id));
      return newSelection;
    });
  }, []);

  const selectAll = useCallback((allProjectIds: string[]) => {
    setSelectedProjects(new Set(allProjectIds));
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

  return {
    selectedProjects,
    toggleProjectSelection,
    selectAllOnPage,
    deselectAllOnPage,
    selectAll,
    clearSelection,
    isProjectSelected,
  };
};
