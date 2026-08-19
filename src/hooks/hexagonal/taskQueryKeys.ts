/**
 * Clés de cache unifiées des tâches (table unique btp.task_assignments).
 *
 * Toutes les vues (globale /tasks, projet, phase) lisent la même table via
 * TaskAssignmentService. Chaque mutation doit donc invalider TOUTES les racines
 * de cache pour éviter les incohérences entre vues.
 */

import type { QueryClient } from '@tanstack/react-query';

export const TASK_QUERY_KEY_ROOTS = [
  'task-assignments',
  'task-assignments-hex',
  'task-assignment-hex',
  'project-tasks',
  'enhanced-tasks',
  'phase-tasks-hex',
  'tasks',
  'task-list',
] as const;

/** Invalide l'ensemble des caches liés aux tâches. */
export function invalidateAllTaskQueries(queryClient: QueryClient): void {
  TASK_QUERY_KEY_ROOTS.forEach((root) => {
    queryClient.invalidateQueries({ queryKey: [root] });
  });
}
