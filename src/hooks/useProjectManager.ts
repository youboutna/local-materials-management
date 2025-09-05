// hooks/useProjectManager.ts
import { useContext } from 'react';
import { ProjectManagerContext } from '@/services/ProjectManagerContext';

export const useProjectManager = () => {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    // Return a default implementation when provider is not available
    return {
      data: null,
      runChecks: async () => {},
      acknowledgeAlert: () => {}
    };
  }
  return context;
};