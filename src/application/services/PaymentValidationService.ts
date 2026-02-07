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
   * Get count of blocked payments for current month
   */
  async getBlockedPaymentsCount(): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const blockedPayments = await this.paymentBlockingRepository.findByDateRange(
        startOfMonth,
        new Date()
      );

      return blockedPayments.filter(payment => !payment.resolvedAt).length;
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
      const currentDate = new Date();
      const expiredInsurances = await this.insuranceRepository.findExpired(currentDate);
      
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
      const missingDocuments = await this.documentRepository.findByStatus('draft');
      const contractDocuments = missingDocuments.filter(doc => doc.type === 'contract');
      
      return contractDocuments.length;
    } catch (error) {
      console.error('PaymentValidationService.getMissingDocumentsCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get missing documents count');
    }
  }

  /**
   * Get count of delayed projects
   */
  async getDelayedProjectsCount(): Promise<number> {
    try {
      const currentDate = new Date();
      const delayedProjects = await this.paymentBlockingRepository.findDelayedProjects(currentDate);
      
      return delayedProjects.length;
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

      // Check for blocked payments
      const blockedPayments = await this.paymentBlockingRepository.findByProjectId(projectId);
      if (blockedPayments.some(payment => !payment.resolvedAt)) {
        blockingReasons.push('Project has unresolved payment blocks');
        recommendations.push('Resolve all payment blocks before processing payment');
      }

      // Check for expired insurances
      const projectInsurances = await this.insuranceRepository.findByProjectId(projectId);
      const expiredInsurances = projectInsurances.filter(insurance => 
        insurance.validUntil && new Date(insurance.validUntil) < new Date()
      );
      if (expiredInsurances.length > 0) {
        blockingReasons.push('Project has expired insurance certificates');
        recommendations.push('Update expired insurance certificates');
      }

      // Check for missing documents
      const projectDocuments = await this.documentRepository.findByProjectId(projectId);
      const requiredDocuments = projectDocuments.filter(doc => doc.type === 'contract' && doc.status === 'draft');
      if (requiredDocuments.length > 0) {
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
