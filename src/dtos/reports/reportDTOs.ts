/**
 * Report DTOs - Architecture Hexagonale
 * Interfaces pour les échanges de données de rapports entre couches
 */

import { TenderDTO as ApplicationTenderDTO } from '@/application/dtos/TenderDTO';
import { SupplierDTO as ApplicationSupplierDTO } from '@/application/dtos/SupplierDTO';
import { PaymentDTO as ApplicationPaymentDTO } from '@/dtos/entities/PaymentDTO';
import { InspectionDTO as ApplicationInspectionDTO } from '@/dtos/entities/InspectionDTO';
import { ProjectDTO as ApplicationProjectDTO } from '@/application/dtos/ProjectDTO';
import { DocumentDTO as ApplicationDocumentDTO } from '@/application/dtos/DocumentDTO';
import { EmployeeDTO as ApplicationEmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { MaterialDTO as ApplicationMaterialDTO } from '@/dtos/entities/MaterialDTO';

// Base DTOs pour les rapports
export interface BaseReportConfig {
  title: string;
  recipientEmail?: string;
  includeHeader: boolean;
  includeFooter: boolean;
  includeSignature: boolean;
  notes?: string;
  template?: string;
  customFields?: Record<string, string | number | boolean>;
}

// DTOs pour les rapports d'inspection
export interface InspectionReportConfig extends BaseReportConfig {
  includeFindings: boolean;
  includeMetrics: boolean;
  includePhotos: boolean;
  includeRecommendations: boolean;
  filterBySeverity?: ('low' | 'medium' | 'high' | 'critical')[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// DTOs pour les rapports de paiements fournisseurs
export interface SupplierPaymentReportConfig extends BaseReportConfig {
  includePaymentDetails: boolean;
  includePaymentHistory: boolean;
  includeOutstandingPayments: boolean;
  includeTaxSummary: boolean;
  groupByCategory?: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  currency?: string;
  includeGraphs?: boolean;
}

export interface PaymentMetricsDTO {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  averagePaymentTime: number; // en jours
  paymentRate: number; // pourcentage
  overdueRate: number; // pourcentage
  categoryBreakdown: Record<string, number>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

// DTOs pour les rapports d'appels d'offres
export interface TenderReportConfig extends BaseReportConfig {
  includeRequirements: boolean;
  includeEvaluationCriteria: boolean;
  includeSubmissions: boolean;
  includeTimeline: boolean;
  includeBudget: boolean;
  includeStatistics: boolean;
  submissionStatus?: 'all' | 'submitted' | 'evaluated' | 'awarded';
}

export interface TenderMetricsDTO {
  totalSubmissions: number;
  evaluatedSubmissions: number;
  awardedSubmissions: number;
  averageScore: number;
  budgetUtilization?: number;
  submissionRate: number;
  evaluationCompletionRate: number;
  categoryBreakdown?: Record<string, number>;
}

// DTOs pour les devis quantitatifs
export interface TenderEstimateDTO {
  id: string;
  title: string;
  reference?: string;
  description?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  currency: string;
  taxRate: number;
  overheadPercentage: number;
  profitMarginPercentage: number;
  validUntil: Date;
  tenderId: string;
  tender: ApplicationTenderDTO;
  items: TenderEstimateItemDTO[];
  totals: TenderEstimateTotalsDTO;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderEstimateItemDTO {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemType: 'material' | 'labor' | 'equipment' | 'other';
  unit?: string;
  materialId?: string;
  specifications?: string;
  notes?: string;
}

export interface TenderEstimateTotalsDTO {
  subtotal: number;
  taxAmount: number;
  overheadAmount: number;
  profitAmount: number;
  finalTotal: number;
  materialsCost: number;
  laborCost: number;
  equipmentCost: number;
  otherCost: number;
}

export interface TenderEstimateConfig extends BaseReportConfig {
  includeCompanyHeader: boolean;
  includeItemDetails: boolean;
  includePriceBreakdown: boolean;
  includeTermsConditions: boolean;
  termsConditions: string;
  recipientEmail?: string;
  notes?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  validityPeriod: number; // en jours
}

// Types d'union pour les props des composants
export type ReportProps = 
  | { type: 'inspection'; data: ApplicationInspectionDTO; config?: InspectionReportConfig }
  | { type: 'payment'; data: ApplicationSupplierDTO; payments: ApplicationPaymentDTO[]; config?: SupplierPaymentReportConfig }
  | { type: 'tender'; data: ApplicationTenderDTO; config?: TenderReportConfig }
  | { type: 'estimate'; data: TenderEstimateDTO; config?: TenderEstimateConfig };

// Types pour les callbacks
export type ReportCallback = (result: ReportGenerationResultDTO) => void;
export type ReportProgressCallback = (progress: number) => void;

// Types pour les résultats de génération
export interface ReportGenerationResultDTO {
  success: boolean;
  reportId?: string;
  fileName?: string;
  blob?: Blob;
  downloadUrl?: string;
  error?: string;
  metadata?: ReportMetadataDTO;
}

export interface ReportMetadataDTO {
  id: string;
  type: 'inspection' | 'payment' | 'tender' | 'estimate';
  title: string;
  description?: string;
  generatedAt: Date;
  generatedBy: string;
  version: string;
  format: 'pdf' | 'excel';
  size?: number; // en bytes
  downloadUrl?: string;
  tags?: string[];
}

// Exportation des DTOs existants - 100% correspondance avec les entités de domaine
export type { ApplicationTenderDTO as TenderDTO };
export type { ApplicationSupplierDTO as SupplierDTO };
export type { ApplicationPaymentDTO as PaymentDTO };
export type { ApplicationInspectionDTO as InspectionDTO };
export type { ApplicationProjectDTO as ProjectDTO };
export type { ApplicationDocumentDTO as DocumentDTO };
export type { ApplicationEmployeeDTO as EmployeeDTO };
export type { ApplicationMaterialDTO as MaterialDTO };
