// ============================================================
// src/hooks/useProjectManager.ts
// ============================================================
/**
 * Project Manager Hook
 * UI Layer - Hook pour accéder au contexte du ProjectManager
 * Avec fallback pour éviter les erreurs quand le Provider est absent
 * 
 * Supporte à la fois les opérations sync et async
 */

import { ProjectManagerContext, ProjectManagerContextType, defaultState, defaultStats } from '@/contexts/ProjectManagerContext';
import { useContext } from 'react';

// ===== Fallback complet avec async/await =====
const createFallbackContext = (): ProjectManagerContextType => ({
  manager: null,
  state: defaultState,
  alerts: [],
  data: defaultState,
  loading: false,
  runChecks: async () => {
    console.warn('⚠️ runChecks: Pas de Provider disponible');
  },
  acknowledgeAlert: async () => {
    console.warn('⚠️ acknowledgeAlert: Pas de Provider disponible');
    return false;
  },
  resolveAlert: async () => {
    console.warn('⚠️ resolveAlert: Pas de Provider disponible');
    return false;
  },
  closeAlert: async () => {
    console.warn('⚠️ closeAlert: Pas de Provider disponible');
    return false;
  },
  getAlertsByType: () => {
    console.warn('⚠️ getAlertsByType: Pas de Provider disponible');
    return [];
  },
  getAlertsBySeverity: () => {
    console.warn('⚠️ getAlertsBySeverity: Pas de Provider disponible');
    return [];
  },
  needsEscalation: () => {
    console.warn('⚠️ needsEscalation: Pas de Provider disponible');
    return false;
  },
  getEscalationPath: () => {
    console.warn('⚠️ getEscalationPath: Pas de Provider disponible');
    return [];
  },
  getActionLabel: () => {
    console.warn('⚠️ getActionLabel: Pas de Provider disponible');
    return '';
  },
  getSummaryStats: () => {
    console.warn('⚠️ getSummaryStats: Pas de Provider disponible');
    return defaultStats;
  }
});

/**
 * Hook principal avec fallback
 * Utilisation: const { state, alerts, acknowledgeAlert } = useProjectManager();
 * 
 * Supporte les opérations async:
 * await acknowledgeAlert(alertId, userId);
 * await resolveAlert(alertId, userId);
 */
export const useProjectManager = (): ProjectManagerContextType => {
  const context = useContext(ProjectManagerContext);
  
  if (!context) {
    console.warn('⚠️ useProjectManager: Pas de ProjectManagerProvider trouvé. Utilisation du fallback.');
    return createFallbackContext();
  }
  
  return context;
};

/**
 * Version stricte - lève une erreur si pas de Provider
 * Utilisation: const { state } = useProjectManagerStrict();
 */
export const useProjectManagerStrict = (): ProjectManagerContextType => {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    throw new Error('useProjectManagerStrict must be used within a ProjectManagerProvider');
  }
  return context;
};

export { ProjectManagerContext };