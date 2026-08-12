// ============================================================
// src/dtos/entities/InsuranceDTO.ts
// ============================================================
/**
 * Insurance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * 
 * Following PROMPTS.md rules:
 * - camelCase pour les propriétés
 * - snake_case pour la compatibilité legacy
 * - Types centralisés
 */

import { BaseEntityDTO } from '../shared';

// ============================================================
// Enums
// ============================================================

/**
 * Insurance certificate status
 * Const-object + union type: les littéraux string restent assignables
 * tout en conservant l'usage `InsuranceCertificateStatus.ACTIVE`.
 */
export const InsuranceCertificateStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring_soon',
  MISSING: 'missing',
  PENDING: 'pending',
  VERIFIED: 'verified',
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  SENT: 'sent',
  RECEIVED: 'received',
  TEST: 'test',
  AWAITING_APPROVAL: 'awaiting_approval',
} as const;
export type InsuranceCertificateStatus =
  (typeof InsuranceCertificateStatus)[keyof typeof InsuranceCertificateStatus];

/**
 * Insurance type
 */
export const InsuranceType = {
  RESPONSABILITE_CIVILE: 'responsabilite_civile',
  DECENNALE: 'decennale',
  VEHICULES: 'vehicules',
  MATERIEL: 'materiel',
  TOUS_RISQUES: 'tous_risques',
} as const;
export type InsuranceType = (typeof InsuranceType)[keyof typeof InsuranceType];


// ============================================================
// Type Aliases (for backward compatibility)
// ============================================================

export type InsuranceStatus = InsuranceCertificateStatus | string;
export type InsuranceTypeValue = InsuranceType | string;

// ============================================================
// DTOs
// ============================================================

/**
 * Insurance Certificate DTO
 * Full certificate data with both camelCase and snake_case support
 */
export interface InsuranceCertificateDTO extends BaseEntityDTO {
  // Core identifiers
  id: string;
  projectId: string;
  contractorId: string;
  
  // Contractor information
  contractorName: string;
  
  // Insurance details
  insuranceType: InsuranceType | string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType?: string;
  
  // Dates
  validFrom: string;
  validUntil: string;
  startDate?: string;
  endDate?: string;
  
  // Status and metadata
  status: InsuranceStatus;
  notes?: string;
  certificateUrl?: string;
  lastVerified?: string;
  verifiedBy?: string;
  documents?: string[] | Record<string, unknown>[];
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  
  // ============================================================
  // Legacy snake_case aliases (PROMPTS.md Pattern 2)
  // ============================================================
  project_id?: string;
  contractor_id?: string;
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Create Insurance Certificate DTO
 */
export interface CreateInsuranceCertificateDTO {
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceType: InsuranceType | string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType?: string;
  validFrom: string;
  validUntil: string;
  status?: InsuranceStatus;
  notes?: string;
  certificateUrl?: string;
  uploadedBy?: string;
  documents?: string[] | Record<string, unknown>[];
  
  // Legacy snake_case
  project_id?: string;
  contractor_id?: string;
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_url?: string;
  uploaded_by?: string;
}

/**
 * Update Insurance Certificate DTO
 */
export interface UpdateInsuranceCertificateDTO {
  contractorName?: string;
  insuranceType?: InsuranceType | string;
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  coverageType?: string;
  validFrom?: string;
  validUntil?: string;
  status?: InsuranceStatus;
  notes?: string;
  certificateUrl?: string;
  updatedBy?: string;
  documents?: string[] | Record<string, unknown>[];
  
  // Legacy snake_case
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_url?: string;
  updated_by?: string;
}

/**
 * Insurance Statistics DTO
 */
export interface InsuranceStatisticsDTO {
  totalCertificates: number;
  activeCertificates: number;
  expiredCertificates: number;
  expiringSoonCertificates: number;
  missingCertificates: number;
  totalCoverageAmount: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byProject: Record<string, number>;
}

/**
 * Insurance Alert DTO
 */
export interface InsuranceAlertDTO {
  id: string;
  certificateId: string;
  type: 'expiring' | 'expired' | 'missing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  daysUntilExpiry?: number;
  projectId?: string;
  contractorId?: string;
  createdAt: string;
  
  // UI convenience fields
  alertLevel?: string;
  insuranceType?: string;
  contractorName?: string;
  policyNumber?: string;
  expiryDate?: string;
  daysRemaining?: number;
  projectTitle?: string;
}

/**
 * Insurance Filter DTO
 */
export interface InsuranceFilterDTO {
  projectId?: string;
  status?: InsuranceStatus | string;
  type?: InsuranceType | string;
  expiringWithin?: number; // days
  contractorId?: string;
  searchTerm?: string;
}

/**
 * Insurance Certificate Form Data
 * For UI forms (React Hook Form)
 */
export interface InsuranceCertificateFormData {
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: InsuranceType | string;
  validFrom: string;
  validUntil: string;
  status: InsuranceStatus;
  notes?: string;
}

// ============================================================
// Helper functions
// ============================================================

/**
 * Get label for insurance type
 */
export function getInsuranceTypeLabel(type: InsuranceType | string): string {
  const labels: Record<string, string> = {
    'responsabilite_civile': 'Responsabilité Civile',
    'decennale': 'Assurance Décennale',
    'vehicules': 'Assurance Véhicules',
    'materiel': 'Assurance Matériel',
    'tous_risques': 'Tous Risques Chantier'
  };
  return labels[type] || type;
}

/**
 * Get label for insurance status
 */
export function getInsuranceStatusLabel(status: InsuranceStatus): string {
  const labels: Record<string, string> = {
    'active': 'Active',
    'expired': 'Expirée',
    'expiring_soon': 'Expire bientôt',
    'missing': 'Manquante',
    'pending': 'En attente',
    'verified': 'Vérifiée',
    'new': 'Nouveau',
    'in_progress': 'En cours',
    'cancelled': 'Annulée',
    'archived': 'Archivée',
    'rejected': 'Rejetée',
    'approved': 'Approuvée',
    'sent': 'Envoyée',
    'received': 'Reçue',
    'test': 'Test',
    'awaiting_approval': 'En attente d\'approbation'
  };
  return labels[status] || status;
}

/**
 * Get color for insurance status (for UI badges)
 */
export function getInsuranceStatusColor(status: InsuranceStatus): string {
  const colors: Record<string, string> = {
    'active': 'bg-green-100 text-green-800',
    'expired': 'bg-red-100 text-red-800',
    'expiring_soon': 'bg-orange-100 text-orange-800',
    'missing': 'bg-gray-100 text-gray-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'verified': 'bg-blue-100 text-blue-800',
    'new': 'bg-purple-100 text-purple-800',
    'in_progress': 'bg-blue-200 text-blue-800',
    'cancelled': 'bg-red-200 text-red-800',
    'archived': 'bg-gray-200 text-gray-800',
    'rejected': 'bg-red-300 text-red-800',
    'approved': 'bg-green-200 text-green-800',
    'sent': 'bg-blue-300 text-blue-800',
    'received': 'bg-green-300 text-green-800',
    'test': 'bg-red-400 text-red-800',
    'awaiting_approval': 'bg-yellow-200 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Check if insurance certificate is active
 */
export function isInsuranceActive(status: InsuranceStatus): boolean {
  return status === InsuranceCertificateStatus.ACTIVE || 
         status === InsuranceCertificateStatus.VERIFIED ||
         status === InsuranceCertificateStatus.APPROVED;
}

/**
 * Check if insurance certificate is expiring soon
 */
export function isInsuranceExpiringSoon(validUntil: string, daysThreshold: number = 30): boolean {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= daysThreshold && diffDays >= 0;
}

/**
 * Check if insurance certificate is expired
 */
export function isInsuranceExpired(validUntil: string): boolean {
  const expiryDate = new Date(validUntil);
  const now = new Date();
  return expiryDate < now;
}

// ============================================================
// Type Guards
// ============================================================

export function isInsuranceCertificateDTO(obj: any): obj is InsuranceCertificateDTO {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.projectId === 'string' &&
         typeof obj.contractorId === 'string' &&
         typeof obj.policyNumber === 'string';
}

export function isInsuranceStatus(value: any): value is InsuranceStatus {
  return Object.values(InsuranceCertificateStatus).includes(value) ||
         ['active', 'expired', 'expiring_soon', 'missing', 'pending', 
          'verified', 'new', 'in_progress', 'cancelled', 'archived', 
          'rejected', 'approved', 'sent', 'received', 'test', 
          'awaiting_approval'].includes(value);
}

export function isInsuranceType(value: any): value is InsuranceType {
  return Object.values(InsuranceType).includes(value) ||
         ['responsabilite_civile', 'decennale', 'vehicules', 
          'materiel', 'tous_risques'].includes(value);
}

// ============================================================
// Re-exports for backward compatibility
// ============================================================

export type InsuranceCertificate = InsuranceCertificateDTO;
export type CreateInsuranceData = CreateInsuranceCertificateDTO;
export type UpdateInsuranceData = UpdateInsuranceCertificateDTO;
export type InsuranceFilter = InsuranceFilterDTO;
export type InsuranceStatistics = InsuranceStatisticsDTO;
export type InsuranceAlert = InsuranceAlertDTO;
// Aliases "Request" historiques (UI / hooks)
export type CreateInsuranceRequestDTO = CreateInsuranceCertificateDTO;
export type UpdateInsuranceRequestDTO = UpdateInsuranceCertificateDTO;
