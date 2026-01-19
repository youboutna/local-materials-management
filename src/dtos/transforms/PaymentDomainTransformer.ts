/**
 * Payment Domain Transformer with BTP Calculations and Business Logic
 * Implements hexagonal architecture principles with enriched calculations
 * Flow: UI => Supabase/API => Database | Database => Supabase/API => UI
 */

import { Payment } from '@/domain/entities/Payment';
import { PaymentDTO, PaymentDetailDTO, PaymentSummaryDTO, PaymentListItemDTO, CreatePaymentRequestDto, UpdatePaymentRequestDto } from '@/dtos/transforms/shared';
import { PaymentStatus } from '@/types/payment';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class PaymentDomainTransformer implements EntityToDTOMapper<Payment, PaymentDTO> {
  /**
   * Calculate payment efficiency and compliance metrics
   */
  static calculatePaymentEfficiency(payment: Payment): {
    const totalPaid = payment.totalPaid || 0;
    const totalDue = payment.totalDue || 0;
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) : 1;
    
    return {
      paymentRate,
      onTimePaymentRate: paymentRate >= 0.95 ? 'excellent' : paymentRate >= 0.85 ? 'good' : paymentRate >= 0.75 ? 'acceptable' : 'poor',
      daysOverdue: payment.daysOverdue || 0,
      averagePaymentDelay: payment.averagePaymentDelay || 0
    };
  }

  /**
   * Calculate payment risk assessment
   */
  static calculatePaymentRisk(payment: Payment): {
    const riskLevel: 'low' | 'medium' | 'high';
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Risk factors
    if (payment.daysOverdue && payment.daysOverdue > 30) {
      riskFactors.push('Severe payment delay');
      riskLevel = 'high';
      recommendations.push('Immediate payment collection required');
    } else if (payment.daysOverdue && payment.daysOverdue > 15) {
      riskFactors.push('Payment delay detected');
      riskLevel = 'medium';
      recommendations.push('Review payment schedule');
    }
    
    // Calculate financial health
    const financialHealth = payment.status === 'paid' ? 'healthy' : 
                       payment.status === 'partial' ? 'warning' : 'critical';
    
    return {
      riskLevel,
      riskFactors,
      recommendations,
      financialHealth
    };
  }

  /**
   * Calculate payment cash flow metrics
   */
  static calculateCashFlowMetrics(payments: Payment[]): {
    const totalPaid = payments.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
    const totalDue = payments.reduce((sum, p) => sum + (p.totalDue || 0), 0);
    const averagePaymentDelay = payments.reduce((sum, p) => sum + (p.averagePaymentDelay || 0), 0) / payments.length;
    const cashFlowVariance = totalPaid - (totalDue * 0.9); // 90% of expected
    
    return {
      totalPaid,
      totalDue,
      cashFlowVariance,
      averagePaymentDelay,
      paymentEfficiency: this.calculatePaymentEfficiency(payments[payments.length - 1] || {})
    };
  }

  /**
   * Transform Payment entity to PaymentDTO
   */
  static toResponseDto(payment: Payment): PaymentDTO {
    const risk = this.calculatePaymentRisk(payment);
    const efficiency = this.calculatePaymentEfficiency(payment);
    
    return {
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      status: payment.status as PaymentStatus,
      progressAtPayment: payment.progressAtPayment,
      transactionId: payment.transactionId,
      contractorName: payment.contractorName,
      contractorContact: payment.contractorContact,
      bankName: payment.bankName,
      accountNumber: payment.accountNumber,
      checkNumber: payment.checkNumber,
      mobileNumber: payment.mobileNumber,
      receiverName: payment.receiverName,
      mobileOperator: payment.mobileOperator,
      secretCode: payment.secretCode,
      secretExpiresAt: payment.secretExpiresAt,
      isSecretActive: payment.isSecretActive || false,
      secretAccessCount: payment.secretAccessCount || 0,
      maxSecretAccess: payment.maxSecretAccess || 0,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      
      // Enriched fields
      risk,
      efficiency,
      daysOverdue: payment.daysOverdue || 0,
      averagePaymentDelay: payment.averagePaymentDelay || 0,
      
      // BTP specific fields
      totalPaid: payment.totalPaid || 0,
      totalDue: payment.totalDue || 0,
      costVariance: payment.costVariance || 0,
      
      // Financial health
      financialHealth: payment.status === 'paid' ? 'healthy' : 
                       payment.status === 'partial' ? 'warning' : 'critical',
      
      // Project metadata
      projectId: payment.projectId || '',
      invoiceId: payment.invoiceId || '',
      
      // Compliance tracking
      complianceScore: payment.complianceScore || 0,
      lastComplianceCheck: payment.lastComplianceCheck || null,
      
      // Workflow metadata
      paymentWorkflowConfig: payment.paymentWorkflowConfig || null,
      paymentFrequency: payment.paymentFrequency || 'monthly',
      initialAdvance: payment.initialAdvance || 0,
      retentionPercentage: payment.retentionPercentage || 5,
      advancePercentage: payment.advancePercentage || 20,
      
      // Meta
      priority: payment.priority || 'medium',
      projectType: payment.projectType || 'construction',
      sector: payment.sector || '',
      permitNumber: payment.permitNumber || '',
      
      // Timestamps
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };
  }

  /**
   * Transform CreatePaymentRequestDto to Payment entity
   */
  static fromCreateDtoToEntity(dto: CreatePaymentRequestDto): Payment {
    return Payment.create({
      id: crypto.randomUUID(),
      amount: dto.amount,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      paymentMethod: dto.paymentMethod,
      progressAtPayment: dto.progressAtPayment || 0,
      transactionId: dto.transactionId,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      checkNumber: dto.checkNumber,
      mobileNumber: dto.mobileNumber,
      receiverName: dto.receiverName,
      mobileOperator: dto.mobileOperator,
      secretCode: dto.secretCode,
      secretExpiresAt: dto.secretExpiresAt,
      isSecretActive: dto.isSecretActive || false,
      secretAccessCount: dto.secretAccessCount || 0,
      maxSecretAccess: dto.maxSecretAccess || 0,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  /**
   * Transform UpdatePaymentRequestDto to partial Payment entity
   */
  static fromUpdateDtoToEntity(dto: UpdatePaymentRequestDto): Partial<Payment> {
    return {
      amount: dto.amount,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
      progressAtPayment: dto.progressAtPayment,
      transactionId: dto.transactionId,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      checkNumber: dto.checkNumber,
      mobileNumber: dto.mobileNumber,
      receiverName: dto.receiverName,
      mobileOperator: dto.mobileOperator,
      secretCode: dto.secretCode,
      secretExpiresAt: dto.secretExpiresAt,
      isSecretActive: dto.isSecretActive,
      secretAccessCount: dto.secretAccessCount,
      maxSecretAccess: dto.maxSecretAccess,
      updated_at: new Date()
    };
  }

  /**
   * Transform Payment entity to PaymentSummaryDTO
   */
  static toSummaryDto(payment: Payment): PaymentSummaryDTO {
    const cashFlow = this.calculateCashFlowMetrics([payment]);
    
    return {
      id: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      status: payment.status as PaymentStatus,
      totalPaid: payment.totalPaid || 0,
      totalDue: payment.totalDue || 0,
      cashFlowVariance: cashFlow.cashFlowVariance,
      averagePaymentDelay: cashFlow.averagePaymentDelay,
      paymentEfficiency: cashFlow.paymentEfficiency,
      
      // Financial health
      financialHealth: payment.status === 'paid' ? 'healthy' : 
                       payment.status === 'partial' ? 'warning' : 'critical',
      
      // Compliance tracking
      complianceScore: payment.complianceScore || 0,
      lastComplianceCheck: payment.lastComplianceCheck,
      
      // Project metadata
      projectId: payment.projectId,
      invoiceId: payment.invoiceId,
      
      // Workflow metadata
      paymentWorkflowConfig: payment.paymentWorkflowConfig,
      paymentFrequency: payment.paymentFrequency,
      initialAdvance: payment.initialAdvance,
      retentionPercentage: payment.retentionPercentage,
      advancePercentage: payment.advancePercentage,
      
      // Meta
      priority: payment.priority,
      projectType: payment.projectType,
      sector: payment.sector,
      permitNumber: payment.permitNumber,
      
      // Timestamps
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };
  }

  /**
   * Validate payment data for business rules
   */
  static validatePaymentData(payment: Partial<Payment>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!payment.amount || payment.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }
    
    if (!payment.paymentDate) {
      errors.push('Payment date is required');
    }
    
    if (!payment.receiverName || payment.receiverName.trim() === '') {
      errors.push('Receiver name is required');
    }
    
    // Validate payment method
    const validMethods = ['cash', 'bank_transfer', 'check', 'credit_card', 'mobile_money'];
    if (payment.paymentMethod && !validMethods.includes(payment.paymentMethod)) {
      errors.push(`Invalid payment method: ${payment.paymentMethod}`);
    }
    
    // Validate contractor information
    if (payment.amount > 10000 && (!payment.contractorName || payment.contractorName.trim() === '')) {
      errors.push('Contractor information required for payments over 10,000');
    }
    
    // Validate BTP specific fields
    if (payment.totalDue !== undefined && payment.totalDue < 0) {
      errors.push('Total due cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
