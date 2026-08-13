import { useMemo } from 'react';
import {
  ProjectMetricsOrchestrator,
  type ProjectMetrics,
  type ProjectMetricsInput,
} from '@/application/services/ProjectMetricsOrchestrator';

/**
 * useProjectMetrics — accès UI à la source UNIQUE de vérité des métriques.
 * Dashboard, Suivi & Évaluation et Rapport PDF consomment ce même jeu de données.
 */
export const useProjectMetrics = (input: ProjectMetricsInput | null | undefined): ProjectMetrics | null =>
  useMemo(() => (input?.project ? ProjectMetricsOrchestrator.compute(input) : null), [input]);

export type { ProjectMetrics };
