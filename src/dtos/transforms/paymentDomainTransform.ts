/**
 * Payment Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates payment calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Payment, PaymentStatus, PaymentMethod, PaymentDocument } from '@/domain/entities/Payment';
import { PaymentDTO, PaymentBlockDTO, PaymentActionDTO } from '@/dtos/entities/PaymentDTO';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';
import { EVMCalculations, BudgetAnalytics } from '@/types/calculations';
import { calculatePaymentEligibility } from '@/utils/paymentCalculations';

// Enhanced types for UI components
export interface PaymentResponseDto extends PaymentDTO {
  // Enhanced fields for UI
  eligibilityStatus?: {
    canProceed: boolean;
    blockingReasons: string[];
    recommendations: string[];
  };
  paymentAnalytics?: {
    totalPaidToDate: number;
    remainingBudget: number;
    budgetUtilization: number;
    estimatedCompletion: number;
  };
  riskAssessment?: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
}

export interface CreatePaymentRequestDto extends Omit<PaymentDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  supportingDocuments?: Array<{
    type: string;
    name: string;
    url: string;
  }>;
  approvalWorkflow?: {
    requiresManagerApproval: boolean;
    requiresFinanceApproval: boolean;
    requiresClientApproval: boolean;
  };
}

export interface UpdatePaymentRequestDto extends Partial<CreatePaymentRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  approvalNotes?: string;
  rejectionReason?: string;
}

export class PaymentDomainTransformer implements EntityToDTOMapper<Payment, PaymentDTO> {
  
  toDTO(entity: Payment): PaymentDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      contractorId: entity.transactionId || '', // Map from transaction ID
      contractorName: entity.contractorName,
      contractorContact: entity.contractorContact,
      amount: entity.amount,
      paymentMethod: entity.paymentMethod,
      paymentDate: entity.paymentDate,
      transactionId: entity.transactionId || '',
      progressAtPayment: entity.progressAtPayment,
      inspectionId: entity.inspectionId || undefined,
      phaseId: entity.phaseId || undefined,
      bankName: entity.bankName,
      accountNumber: entity.accountNumber,
      checkNumber: entity.checkNumber,
      mobileNumber: entity.mobileNumber,
      mobileOperator: entity.mobileOperator,
      receiverName: entity.receiverName,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: PaymentDTO): Payment {
    return new Payment(
      dto.id,
      dto.projectId,
      dto.phaseId || null,
      null, // stepId - not in DTO
      dto.inspectionId || null,
      dto.amount,
      dto.paymentDate,
      dto.paymentMethod as PaymentMethod,
      dto.status as PaymentStatus,
      dto.progressAtPayment,
      dto.transactionId,
      dto.contractorName,
      dto.contractorContact,
      dto.bankName,
      dto.accountNumber,
      dto.checkNumber,
      dto.mobileNumber,
      dto.mobileOperator,
      dto.receiverName,
      dto.documents?.map(doc => ({
        id: doc.id || doc.name,
        type: doc.type,
        name: doc.name,
        url: doc.url
      })) || [],
      dto.createdAt,
      dto.updatedAt
    );
  }

  fromEntityToDTO(entity: Payment): PaymentResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      eligibilityStatus: this.calculatePaymentEligibility(entity),
      paymentAnalytics: this.calculatePaymentAnalytics(entity),
      riskAssessment: this.assessPaymentRisk(entity)
    };
  }

  fromDtosToAdapter(dtos: PaymentDTO[]): PaymentResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Payment): PaymentResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreatePaymentRequestDto): PaymentDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'requested' as PaymentStatus
    };
  }

  toUpdateDto(dto: UpdatePaymentRequestDto): Partial<PaymentDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: PaymentDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    if (!dto.contractorName || dto.contractorName.trim() === '') {
      errors.push('Contractor name is required');
      fieldErrors.contractorName = ['Contractor name is required'];
    }

    if (!dto.amount || dto.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
      fieldErrors.amount = ['Payment amount must be greater than 0'];
    }

    if (!dto.paymentDate) {
      errors.push('Payment date is required');
      fieldErrors.paymentDate = ['Payment date is required'];
    }

    // Payment method specific validation
    if (dto.paymentMethod === 'bank_transfer') {
      if (!dto.bankName) {
        errors.push('Bank name is required for bank transfer');
        fieldErrors.bankName = ['Bank name is required for bank transfer'];
      }
      if (!dto.accountNumber) {
        errors.push('Account number is required for bank transfer');
        fieldErrors.accountNumber = ['Account number is required for bank transfer'];
      }
    }

    if (dto.paymentMethod === 'check' && !dto.checkNumber) {
      errors.push('Check number is required for check payment');
      fieldErrors.checkNumber = ['Check number is required for check payment'];
    }

    if (dto.paymentMethod === 'mobile_money') {
      if (!dto.mobileNumber) {
        errors.push('Mobile number is required for mobile money');
        fieldErrors.mobileNumber = ['Mobile number is required for mobile money'];
      }
      if (!dto.mobileOperator) {
        errors.push('Mobile operator is required for mobile money');
        fieldErrors.mobileOperator = ['Mobile operator is required for mobile money'];
      }
    }

    // Progress validation
    if (dto.progressAtPayment < 0 || dto.progressAtPayment > 100) {
      errors.push('Progress at payment must be between 0 and 100');
      fieldErrors.progressAtPayment = ['Progress at payment must be between 0 and 100'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculatePaymentEligibility(payment: Payment): any {
    try {
      return calculatePaymentEligibility(
        payment.projectId,
        payment.contractorName,
        payment.amount,
        payment.progressAtPayment
      );
    } catch (error) {
      console.error('Error calculating payment eligibility:', error);
      return {
        canProceed: false,
        blockingReasons: ['Error calculating eligibility'],
        recommendations: ['Contact system administrator']
      };
    }
  }

  static calculatePaymentAnalytics(payment: Payment): any {
    // This would typically fetch project data and calculate analytics
    return {
      totalPaidToDate: payment.amount,
      remainingBudget: 0, // Would calculate from project budget
      budgetUtilization: 0, // Would calculate from project budget
      estimatedCompletion: payment.progressAtPayment
    };
  }

  static assessPaymentRisk(payment: Payment): any {
    const riskFactors: string[] = [];
    const mitigation: string[] = [];
    let level: 'low' | 'medium' | 'high' = 'low';

    // Amount-based risk
    if (payment.amount > 100000) {
      riskFactors.push('High payment amount');
      mitigation.push('Requires additional approval');
      level = 'medium';
    }

    // Progress-based risk
    if (payment.progressAtPayment > 90) {
      riskFactors.push('Late payment (high progress)');
      mitigation.push('Verify completion status');
      level = 'high';
    }

    // Method-based risk
    if (payment.paymentMethod === 'cash') {
      riskFactors.push('Cash payment method');
      mitigation.push('Require receipt and documentation');
      level = 'medium';
    }

    return {
      level,
      factors: riskFactors,
      mitigation
    };
  }

  static calculateEVMPaymentMetrics(payments: Payment[]): EVMCalculations {
    const totalPlannedValue = payments.reduce((sum, p) => sum + (p.amount * (p.progressAtPayment / 100)), 0);
    const totalEarnedValue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalActualCost = totalEarnedValue; // Simplified - would need actual cost data

    return {
      plannedValue: totalPlannedValue,
      earnedValue: totalEarnedValue,
      actualCost: totalActualCost,
      scheduleVariance: totalEarnedValue - totalPlannedValue,
      costVariance: totalEarnedValue - totalActualCost,
      schedulePerformanceIndex: totalPlannedValue > 0 ? totalEarnedValue / totalPlannedValue : 0,
      costPerformanceIndex: totalActualCost > 0 ? totalEarnedValue / totalActualCost : 0,
      budgetAtCompletion: totalPlannedValue,
      estimateAtCompletion: totalActualCost > 0 ? totalPlannedValue / (totalEarnedValue / totalActualCost) : totalPlannedValue,
      estimateToComplete: 0,
      varianceAtCompletion: 0
    };
  }

  static generatePaymentReport(payment: Payment): any {
    const eligibility = PaymentDomainTransformer.calculatePaymentEligibility(payment);
    const analytics = PaymentDomainTransformer.calculatePaymentAnalytics(payment);
    const risk = PaymentDomainTransformer.assessPaymentRisk(payment);

    return {
      paymentInfo: {
        id: payment.id,
        amount: payment.amount,
        contractor: payment.contractorName,
        date: payment.paymentDate,
        method: payment.paymentMethod,
        status: payment.status
      },
      eligibility,
      analytics,
      risk,
      recommendations: PaymentDomainTransformer.generatePaymentRecommendations(payment, eligibility, risk),
      generatedAt: new Date().toISOString()
    };
  }

  static generatePaymentRecommendations(payment: Payment, eligibility: any, risk: any): string[] {
    const recommendations: string[] = [];

    if (!eligibility.canProceed) {
      recommendations.push('Resolve blocking issues before proceeding');
    }

    if (risk.level === 'high') {
      recommendations.push('Implement additional verification steps');
    }

    if (payment.progressAtPayment < 50) {
      recommendations.push('Consider milestone-based payments');
    }

    return recommendations;
  }

  static formatPaymentAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  static getPaymentStatusColor(status: PaymentStatus): string {
    switch (status) {
      case 'requested': return '#FFA500'; // Orange
      case 'pending_validation': return '#FFD700'; // Gold
      case 'validated': return '#4169E1'; // Royal Blue
      case 'approved': return '#32CD32'; // Lime Green
      case 'rejected': return '#DC143C'; // Crimson
      case 'paid': return '#228B22'; // Forest Green
      case 'cancelled': return '#696969'; // Dim Gray
      default: return '#808080'; // Gray
    }
  }

  static validatePaymentWorkflow(payment: Payment, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresManagerApproval && !payment.transactionId) {
      errors.push('Manager approval required');
      fieldErrors.transactionId = ['Manager approval required'];
    }

    if (workflow.requiresFinanceApproval && payment.amount > 50000) {
      errors.push('Finance approval required for amounts > 50,000€');
      fieldErrors.amount = ['Finance approval required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }
}
