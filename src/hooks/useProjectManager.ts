// hooks/useProjectManager.ts
import { useContext } from 'react';
import { ProjectManagerContext } from '@/services/ProjectManagerContext';

export const useProjectManager = () => {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    throw new Error('useProjectManager must be used within a ProjectManagerProvider');
  }
  return context;
};