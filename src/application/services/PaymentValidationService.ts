/**
 * Payment Validation Service
 * Application service for payment validation operations
 * Following hexagonal architecture principles
 */

import { IPaymentBlockingRepository } from '@/domain/repositories/IPaymentBlockingRepository';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { IInsuranceRepository } from '@/domain/repositories/IInsuranceRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface PaymentStats {
  blockedPayments: number;
  expiredInsurances: number;
  delayedProjects: number;
  missingDocuments: number;
}

/**
 * Payment Validation Service
 * Orchestrates payment validation operations using domain repositories
 */
export class PaymentValidationService {
  private paymentBlockingRepository: IPaymentBlockingRepository;
  private bankGuaranteeRepository: IBankGuaranteeRepository;
  private insuranceRepository: IInsuranceRepository;
  private documentRepository: IDocumentRepository;

  constructor(
    paymentBlockingRepository?: IPaymentBlockingRepository,
    bankGuaranteeRepository?: IBankGuaranteeRepository,
    insuranceRepository?: IInsuranceRepository,
    documentRepository?: IDocumentRepository
  ) {
    this.paymentBlockingRepository = paymentBlockingRepository || RepositoryFactory.getPaymentBlockingRepository();
    this.bankGuaranteeRepository = bankGuaranteeRepository || RepositoryFactory.getBankGuaranteeRepository();
    this.insuranceRepository = insuranceRepository || RepositoryFactory.getInsuranceRepository();
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
  }

  /**
   * Get count of blocked payments (active blocks)
   */
  async getBlockedPaymentsCount(): Promise<number> {
    try {
      const activeBlocks = await this.paymentBlockingRepository.getActiveBlocks();
      return activeBlocks.length;
    } catch (error) {
      console.error('PaymentValidationService.getBlockedPaymentsCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get blocked payments count');
    }
  }

  /**
   * Get count of expired insurance certificates
   */
  async getExpiredInsurancesCount(): Promise<number> {
    try {
      // Use getExpiringSoon with 0 days threshold to get already expired
      const expiredInsurances = await this.insuranceRepository.getExpiringSoon(0);
      return expiredInsurances.length;
    } catch (error) {
      console.error('PaymentValidationService.getExpiredInsurancesCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get expired insurances count');
    }
  }

  /**
   * Get count of missing documents
   */
  async getMissingDocumentsCount(): Promise<number> {
    try {
      const draftDocuments = await this.documentRepository.findByStatus('draft' as any);
      const contractDocuments = draftDocuments.filter(doc => doc.documentType === 'contract');
      return contractDocuments.length;
    } catch (error) {
      console.error('PaymentValidationService.getMissingDocumentsCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get missing documents count');
    }
  }

  /**
   * Get count of delayed projects (using overdue actions as proxy)
   */
  async getDelayedProjectsCount(): Promise<number> {
    try {
      const overdueActions = await this.paymentBlockingRepository.getOverdueActions();
      return overdueActions.length;
    } catch (error) {
      console.error('PaymentValidationService.getDelayedProjectsCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get delayed projects count');
    }
  }

  /**
   * Get complete payment validation statistics
   */
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const [
        blockedPayments,
        expiredInsurances,
        delayedProjects,
        missingDocuments
      ] = await Promise.all([
        this.getBlockedPaymentsCount(),
        this.getExpiredInsurancesCount(),
        this.getDelayedProjectsCount(),
        this.getMissingDocumentsCount()
      ]);

      return {
        blockedPayments,
        expiredInsurances,
        delayedProjects,
        missingDocuments
      };
    } catch (error) {
      console.error('PaymentValidationService.getPaymentStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment statistics');
    }
  }

  /**
   * Factory method for UI compatibility
   */
  static getPaymentValidationService(): PaymentValidationService {
    return new PaymentValidationService();
  }

  /**
   * Calculate allowed payment amount for a project (UI compatibility)
   */
  async calculateAllowedAmount(projectId: string): Promise<number> {
    try {
      const project = await this.documentRepository.findByProjectId(projectId);
      return 1000; // Placeholder - implement proper calculation
    } catch (error) {
      console.error('PaymentValidationService.calculateAllowedAmount failed:', error);
      return 0;
    }
  }

  /**
   * Get maximum allowed amount with tolerance (UI compatibility)
   */
  async getMaxAllowedAmountWithTolerance(projectId: string): Promise<number> {
    const allowedAmount = await this.calculateAllowedAmount(projectId);
    return allowedAmount * 1.5;
  }

  /**
   * Validate payment for a project
   */
  async validatePayment(projectId: string): Promise<{
    canPay: boolean;
    blockingReasons: string[];
    recommendations: string[];
  }> {
    try {
      const blockingReasons: string[] = [];
      const recommendations: string[] = [];

      // Check for active payment blocks
      const activeBlocks = await this.paymentBlockingRepository.getActiveBlocks();
      if (activeBlocks.length > 0) {
        blockingReasons.push('There are active payment blocks');
        recommendations.push('Resolve all payment blocks before processing payment');
      }

      // Check for expiring insurances
      const expiringInsurances = await this.insuranceRepository.getExpiringSoon(0);
      if (expiringInsurances.length > 0) {
        blockingReasons.push('Project has expired insurance certificates');
        recommendations.push('Update expired insurance certificates');
      }

      // Check for missing documents
      const projectDocuments = await this.documentRepository.findByProjectId(projectId);
      const draftContracts = projectDocuments.filter(doc => doc.documentType === 'contract' && doc.status === 'draft');
      if (draftContracts.length > 0) {
        blockingReasons.push('Project has missing required documents');
        recommendations.push('Complete all required contract documents');
      }

      return {
        canPay: blockingReasons.length === 0,
        blockingReasons,
        recommendations
      };
    } catch (error) {
      console.error('PaymentValidationService.validatePayment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate payment');
    }
  }
}
