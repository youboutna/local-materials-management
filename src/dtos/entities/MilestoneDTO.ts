/**
 * MilestoneDTO
 * 
 * Jalon de projet avec méthodologie PM (Waterfall, PERT, CPM)
 */

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';
export type MilestoneType = 'gate' | 'deliverable' | 'checkpoint' | 'event';
export type MilestonePriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Milestone de projet
 */
export interface MilestoneDTO {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  status: MilestoneStatus;
  completedDate?: string;
  phaseId: string;
  progress: number;
  weight: number;
  priority: MilestonePriority;
  type: MilestoneType;
  
  // Dépendances PERT/CPM
  predecessorIds?: string[];
  successorIds?: string[];
  
  // Livrables attendus
  deliverables?: string[];
  
  // Exigences d'approbation
  approvalRequirements?: string[];
  
  // Inspection requise
  requiresInspection?: boolean;
  
  // Métadonnées
  tags?: string[];
  notes?: string;
  
  // Dates
  createdAt: string;
  updatedAt: string;
}
