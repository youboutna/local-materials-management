/**
 * Supplier Payment Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * 
 * Architecture Hexagonale :
 * - camelCase pour les DTOs
 * - Utilisés par les services et l'UI
 * - Correspondance avec la table supplier_payment_requests
 * - Version unifiée avec ISupplierPaymentRepository
 */

import { BaseEntityDTO } from '../shared';

// ============================================================================
// TYPES
// ============================================================================

export type SupplierPaymentStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
export type SupplierPaymentType = 'contractor_progress' | 'inspector_fee' | 'advance' | 'final' | 'retention' | 'other';

// ============================================================================
// DTO PRINCIPAL
// ============================================================================

export interface SupplierPaymentRequestDTO extends BaseEntityDTO {
  /** ID de l'inspection associée */
  inspectionId: string;
  /** ID du fournisseur */
  supplierId: string;
  /** ID du projet (optionnel) */
  projectId?: string;
  /** Montant en MRU */
  amount: number;
  /** Devise (défaut: MRU) */
  currency: string;
  /** Statut de la demande */
  status: SupplierPaymentStatus;
  /** Date de la demande */
  requestedAt: string;
  /** Date de traitement */
  processedAt?: string;
  /** Commentaires */
  comments?: string;
  /** Notes (alias pour comments) */
  notes?: string;
  /** Documents justificatifs */
  documents: string[];
  /** Type de paiement */
  paymentType: string;
  /** Compte bancaire */
  bankAccount?: string;
  /** Numéro de facture */
  invoiceNumber?: string;
  /** Date de facture */
  invoiceDate?: string;
  /** Description des travaux */
  workDescription?: string;
  /** Localisation des travaux */
  workLocation?: string;
  /** Période des travaux */
  workPeriod?: string;
  /** Validé par */
  validatedBy?: string;
  /** Date de validation */
  validatedAt?: string;
  /** Raison du rejet */
  rejectionReason?: string;
  /** Approuvé par (alias pour validatedBy) */
  approvedBy?: string;
  /** Date d'approbation (alias pour validatedAt) */
  approvedAt?: string;
  /** Raison du paiement (pour compatibilité) */
  paymentReason?: string;
  /** Documents support (pour compatibilité) */
  supportingDocuments?: string[];
}

// ============================================================================
// DTO DE CRÉATION
// ============================================================================

export interface CreateSupplierPaymentRequestDTO {
  /** ID de l'inspection associée */
  inspectionId: string;
  /** ID du fournisseur */
  supplierId: string;
  /** ID du projet (optionnel) */
  projectId?: string;
  /** Montant en MRU */
  amount: number;
  /** Devise (défaut: MRU) */
  currency?: string;
  /** Type de paiement */
  paymentType: string;
  /** Commentaires */
  comments?: string;
  /** Notes (alias pour comments) */
  notes?: string;
  /** Documents justificatifs */
  documents?: string[];
  /** Documents support (alias pour documents) */
  supportingDocuments?: string[];
  /** Compte bancaire */
  bankAccount?: string;
  /** Numéro de facture */
  invoiceNumber?: string;
  /** Date de facture */
  invoiceDate?: string;
  /** Description des travaux */
  workDescription?: string;
  /** Localisation des travaux */
  workLocation?: string;
  /** Période des travaux */
  workPeriod?: string;
  /** Raison du paiement */
  paymentReason?: string;
  /** Statut initial (défaut: pending) */
  status?: SupplierPaymentStatus;
  /** Date de la demande (défaut: maintenant) */
  requestedAt?: string;
  /** Date de la demande (alias pour requestedAt) */
  requestedDate?: string;
}

// ============================================================================
// DTO DE MISE À JOUR
// ============================================================================

export interface UpdateSupplierPaymentRequestDTO {
  /** Statut de la demande */
  status?: SupplierPaymentStatus;
  /** Commentaires */
  comments?: string;
  /** Notes (alias pour comments) */
  notes?: string;
  /** Raison du rejet */
  rejectionReason?: string;
  /** Validé par */
  validatedBy?: string;
  /** Approuvé par (alias pour validatedBy) */
  approvedBy?: string;
  /** Date de validation */
  validatedAt?: string;
  /** Date d'approbation (alias pour validatedAt) */
  approvedAt?: string;
  /** Documents justificatifs */
  documents?: string[];
  /** Documents support (alias pour documents) */
  supportingDocuments?: string[];
  /** Type de paiement */
  paymentType?: string;
  /** Compte bancaire */
  bankAccount?: string;
  /** Numéro de facture */
  invoiceNumber?: string;
  /** Date de facture */
  invoiceDate?: string;
  /** Description des travaux */
  workDescription?: string;
  /** Localisation des travaux */
  workLocation?: string;
  /** Période des travaux */
  workPeriod?: string;
  /** Montant */
  amount?: number;
  /** Raison du paiement */
  paymentReason?: string;
}

// ============================================================================
// DTO DE RÉPONSE (LISTE)
// ============================================================================

export interface SupplierPaymentRequestListDTO {
  items: SupplierPaymentRequestDTO[];
  total: number;
  page: number;
  limit: number;
  statusCounts?: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    cancelled: number;
  };
}

// ============================================================================
// DTO DE STATISTIQUES
// ============================================================================

export interface SupplierPaymentStatsDTO {
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  averageAmount: number;
  countByStatus: Record<SupplierPaymentStatus, number>;
  countByType: Record<string, number>;
  recentPayments: SupplierPaymentRequestDTO[];
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Map des statuts vers les libellés d'affichage
 */
export const SUPPLIER_PAYMENT_STATUS_LABELS: Record<SupplierPaymentStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  paid: 'Payé',
  cancelled: 'Annulé',
};

/**
 * Map des statuts vers les couleurs
 */
export const SUPPLIER_PAYMENT_STATUS_COLORS: Record<SupplierPaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-blue-100 text-blue-800 border-blue-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

/**
 * Map des types de paiement vers les libellés
 */
export const SUPPLIER_PAYMENT_TYPE_LABELS: Record<SupplierPaymentType, string> = {
  contractor_progress: 'Avancement contractant',
  inspector_fee: 'Honoraires inspecteur',
  advance: 'Avance',
  final: 'Paiement final',
  retention: 'Retenue de garantie',
  other: 'Autre',
};

/**
 * Normalise un statut de paiement
 */
export function normalizePaymentStatus(status: string): SupplierPaymentStatus {
  const normalized = status?.toLowerCase().trim() || 'pending';
  const validStatuses: SupplierPaymentStatus[] = ['pending', 'approved', 'rejected', 'paid', 'cancelled'];
  return validStatuses.includes(normalized as SupplierPaymentStatus) 
    ? normalized as SupplierPaymentStatus 
    : 'pending';
}

/**
 * Normalise un type de paiement
 */
export function normalizePaymentType(type: string): SupplierPaymentType {
  const normalized = type?.toLowerCase().trim() || 'other';
  const validTypes: SupplierPaymentType[] = ['contractor_progress', 'inspector_fee', 'advance', 'final', 'retention', 'other'];
  return validTypes.includes(normalized as SupplierPaymentType) 
    ? normalized as SupplierPaymentType 
    : 'other';
}