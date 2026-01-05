/**
 * Completion Validation Utilities
 * Validates that all required checkpoints are completed and progress threshold is met
 * before marking phase/project as completed
 */

import { MilestoneSummaryDTO } from '@/types/milestone-dto';

// Default minimum progress percentage required to mark as completed
export const DEFAULT_COMPLETION_PROGRESS_THRESHOLD = 100;

export interface CompletionValidationResult {
  canComplete: boolean;
  pendingCheckpoints: MilestoneSummaryDTO[];
  completedCheckpoints: MilestoneSummaryDTO[];
  totalCheckpoints: number;
  completedCount: number;
  message: string;
  // Progress validation
  progressMet: boolean;
  currentProgress: number;
  requiredProgress: number;
  progressMessage: string;
}

export interface CompletionValidationOptions {
  progressThreshold?: number; // Minimum progress percentage (0-100)
}

/**
 * Validates if a phase or project can be marked as completed
 * Requires:
 * 1. All checkpoint and gate type milestones to be completed
 * 2. Progress to meet the required threshold (default 100%)
 */
export function validateCompletionReadiness(
  milestones: MilestoneSummaryDTO[],
  currentProgress: number = 0,
  options: CompletionValidationOptions = {}
): CompletionValidationResult {
  const { progressThreshold = DEFAULT_COMPLETION_PROGRESS_THRESHOLD } = options;

  // Filter only actionable milestones (checkpoints and gates)
  const checkpoints = milestones.filter(
    m => m.type === 'checkpoint' || m.type === 'gate'
  );

  const completedCheckpoints = checkpoints.filter(m => m.status === 'completed');
  const pendingCheckpoints = checkpoints.filter(m => m.status !== 'completed');

  const checkpointsComplete = pendingCheckpoints.length === 0;
  const totalCheckpoints = checkpoints.length;
  const completedCount = completedCheckpoints.length;

  // Progress validation
  const normalizedProgress = Math.min(100, Math.max(0, currentProgress));
  const progressMet = normalizedProgress >= progressThreshold;

  // Can only complete if both conditions are met
  const canComplete = checkpointsComplete && progressMet;

  // Build checkpoint message
  let message = '';
  if (checkpointsComplete) {
    if (totalCheckpoints === 0) {
      message = 'Aucun point de contrôle défini.';
    } else {
      message = `Tous les ${totalCheckpoints} points de contrôle sont terminés.`;
    }
  } else {
    message = `${pendingCheckpoints.length} point(s) de contrôle non terminé(s).`;
  }

  // Build progress message
  let progressMessage = '';
  if (progressMet) {
    progressMessage = `Progression atteinte: ${normalizedProgress}%`;
  } else {
    progressMessage = `Progression insuffisante: ${normalizedProgress}% (minimum requis: ${progressThreshold}%)`;
  }

  return {
    canComplete,
    pendingCheckpoints,
    completedCheckpoints,
    totalCheckpoints,
    completedCount,
    message,
    progressMet,
    currentProgress: normalizedProgress,
    requiredProgress: progressThreshold,
    progressMessage
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

/**
 * Get combined validation message for UI display
 */
export function getCompletionBlockReasons(validation: CompletionValidationResult): string[] {
  const reasons: string[] = [];
  
  if (validation.pendingCheckpoints.length > 0) {
    reasons.push(`${validation.pendingCheckpoints.length} point(s) de contrôle non terminé(s)`);
  }
  
  if (!validation.progressMet) {
    reasons.push(`Progression à ${validation.currentProgress}% (min. ${validation.requiredProgress}%)`);
  }
  
  return reasons;
}
