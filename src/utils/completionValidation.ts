/**
 * Completion Validation Utilities
 * Validates that all required checkpoints are completed before marking phase/project as completed
 */

import { MilestoneSummaryDTO } from '@/types/milestone-dto';

export interface CompletionValidationResult {
  canComplete: boolean;
  pendingCheckpoints: MilestoneSummaryDTO[];
  completedCheckpoints: MilestoneSummaryDTO[];
  totalCheckpoints: number;
  completedCount: number;
  message: string;
}

/**
 * Validates if a phase or project can be marked as completed
 * Requires all checkpoint and gate type milestones to be completed first
 */
export function validateCompletionReadiness(
  milestones: MilestoneSummaryDTO[]
): CompletionValidationResult {
  // Filter only actionable milestones (checkpoints and gates)
  const checkpoints = milestones.filter(
    m => m.type === 'checkpoint' || m.type === 'gate'
  );

  const completedCheckpoints = checkpoints.filter(m => m.status === 'completed');
  const pendingCheckpoints = checkpoints.filter(m => m.status !== 'completed');

  const canComplete = pendingCheckpoints.length === 0;
  const totalCheckpoints = checkpoints.length;
  const completedCount = completedCheckpoints.length;

  let message = '';
  if (canComplete) {
    if (totalCheckpoints === 0) {
      message = 'Aucun point de contrôle défini. Vous pouvez marquer comme terminé.';
    } else {
      message = `Tous les ${totalCheckpoints} points de contrôle sont terminés.`;
    }
  } else {
    message = `${pendingCheckpoints.length} point(s) de contrôle non terminé(s). Complétez-les avant de marquer comme terminé.`;
  }

  return {
    canComplete,
    pendingCheckpoints,
    completedCheckpoints,
    totalCheckpoints,
    completedCount,
    message
  };
}

/**
 * Formats the list of pending checkpoints for display
 */
export function formatPendingCheckpoints(
  pendingCheckpoints: MilestoneSummaryDTO[]
): string {
  if (pendingCheckpoints.length === 0) return '';
  
  const names = pendingCheckpoints.map(c => `• ${c.title}`);
  return names.join('\n');
}

/**
 * Calculates completion percentage based on checkpoints
 */
export function calculateCheckpointProgress(
  milestones: MilestoneSummaryDTO[]
): number {
  const checkpoints = milestones.filter(
    m => m.type === 'checkpoint' || m.type === 'gate'
  );

  if (checkpoints.length === 0) return 100;

  const completed = checkpoints.filter(m => m.status === 'completed').length;
  return Math.round((completed / checkpoints.length) * 100);
}
