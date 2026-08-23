/**
 * AutomaticDecompteDTO
 * 
 * Décompte calculé automatiquement basé sur les jalons vérifiés
 * Règles Mauritanie: retenues, paiements échelonnés, inspections obligatoires
 */

// Types importés localement pour éviter les imports cycliques
type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';

export type DecompteStatus = 'draft' | 'calculated' | 'submitted' | 'approved' | 'paid' | 'rejected';
export type PaymentType = 'initial' | 'progress' | 'retention_release' | 'final';

/**
 * Décompte calculé automatiquement
 */
export interface AutomaticDecompteDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  decompteNumber: number; // Numéro séquentiel du décompte
  decompteType: PaymentType;
  
  // Montants
  contractAmount: number;
  previousCumulative: number;
  currentPeriodAmount: number;
  cumulativeAmount: number;
  
  // Retenues Mauritanie
  retentionRate: number; // 10% par défaut
  retentionAmount: number;
  previousRetentionReleased: number;
  retentionToRelease: number;
  
  // Montant net
  netPayable: number;
  
  // Calcul basé sur jalons
  verifiedMilestones: {
    milestoneId: string;
    title: string;
    weight: number;
    amount: number;
    verifiedAt: string;
  }[];
  
  // Lignes détaillées
  lines: DecompteLineDTO[];
  
  // Justification
  progressAtDecompte: number;
  inspectionReference?: string;
  pvReference?: string;
  
  // État
  status: DecompteStatus;
  calculatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  
  // Historique
  calculationLog: {
    timestamp: string;
    action: string;
    details: Record<string, unknown>;
  }[];
}

/**
 * Ligne de décompte détaillée
 */
export interface DecompteLineDTO {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  category: 'works' | 'materials' | 'services' | 'other';
  milestoneId?: string;
  checkpointId?: string;
  verificationStatus: VerificationStatus;
}
