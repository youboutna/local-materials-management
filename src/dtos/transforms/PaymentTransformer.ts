/**
 * Payment Transformer - Hexagonal Architecture
 * Transforms between Payment entities and DTOs
 * ✅ CORRIGÉ : fromCreateDTOToEntity utilise projectRef, phaseRef, inspectionRef
 */

import { Payment, PaymentMethod, PaymentStatus } from '@/domain/entities/Payment';
import { CreatePaymentDTO, PaymentDTO, PaymentRequestDTO, UpdatePaymentDTO } from '@/dtos/entities/PaymentDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export type PaymentOrigin = 'decompte' | 'inspection' | 'manual' | 'import';
export interface PaymentEfficiencyResult {
  paymentRate: number;
  onTimePaymentRate: string;
  daysOverdue: number;
  averagePaymentDelay: number;
}

export interface PaymentRiskResult {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
  financialHealth: string;
}

export interface CashFlowMetricsResult {
  totalPaid: number;
  totalDue: number;
  cashFlowVariance: number;
  averagePaymentDelay: number;
  paymentEfficiency: PaymentEfficiencyResult;
}

export class PaymentTransformer implements EntityToDTOMapper<Payment, PaymentDTO> {
  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(payments: Payment[]): PaymentDTO[] {
    return payments.map(payment => this.toDTO(payment));
  }

  /**
   * Transform Payment entity to PaymentDTO (Domain Entity → DTO)
   */
  static toDTO(entity: Payment): PaymentDTO {
    return {
      id: entity.id,
      projectId: entity.projectRef?.id ?? '',
      contractorId: entity.contractorId || '',
      contractorName: entity.contractorName,
      contractorContact: entity.contractorContact,
      amount: entity.amount,
      paymentDate: entity.paymentDate,
      paymentMethod: entity.paymentMethod,
      transactionId: entity.transactionId || '',
      progressAtPayment: entity.progressAtPayment,
      inspectionId: entity.inspectionRef?.id ?? '',
      phaseId: entity.phaseRef?.id ?? '',
      bankName: entity.bankName || '',
      accountNumber: entity.accountNumber || '',
      checkNumber: entity.checkNumber || '',
      mobileNumber: entity.mobileNumber || '',
      mobileOperator: entity.mobileOperator || '',
      receiverName: entity.receiverName || '',
      status: entity.status,
      notes: entity.notes || '',
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Transform PaymentDTO to Payment entity (DTO → Domain Entity)
   */
  static toEntity(dto: PaymentDTO): Payment {
    return Payment.create({
      id: dto.id,
      projectRef: dto.projectId ? { id: dto.projectId } : null,
      phaseRef: dto.phaseId ? { id: dto.phaseId } : null,
      inspectionRef: dto.inspectionId ? { id: dto.inspectionId } : null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      contractorId: dto.contractorId || null,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      progressAtPayment: dto.progressAtPayment,
      paymentDate: dto.paymentDate || new Date().toISOString(),
      transactionId: dto.transactionId || null,
      bankName: dto.bankName || null,
      accountNumber: dto.accountNumber || null,
      checkNumber: dto.checkNumber || null,
      mobileNumber: dto.mobileNumber || null,
      mobileOperator: dto.mobileOperator || null,
      receiverName: dto.receiverName || null,
      notes: dto.notes || null,
    });
  }

  /**
   * ✅ CORRIGÉ : Transform CreatePaymentDTO to Payment entity
   * Utilise projectRef, phaseRef, inspectionRef pour les références
   */
  static fromCreateDTOToEntity(dto: CreatePaymentDTO): Payment {
    const id = (dto as any).id || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return Payment.create({
      id,
      projectRef: dto.projectId ? { id: dto.projectId } : null,
      phaseRef: dto.phaseId ? { id: dto.phaseId } : null,
      inspectionRef: dto.inspectionId ? { id: dto.inspectionId } : null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      contractorId: dto.contractorId || null,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact || '',
      progressAtPayment: dto.progressAtPayment,
      paymentDate: dto.paymentDate || new Date().toISOString(),
      transactionId: dto.transactionId || null,
      bankName: dto.bankName || null,
      accountNumber: dto.accountNumber || null,
      checkNumber: dto.checkNumber || null,
      mobileNumber: dto.mobileNumber || null,
      mobileOperator: dto.mobileOperator || null,
      receiverName: dto.receiverName || null,
      createdBy: dto.createdBy || null,
      notes: dto.notes || null,
    });
  }

  /**
   * Transform UpdatePaymentDTO to partial Payment entity
   */
  static fromUpdateDTOToEntity(dto: UpdatePaymentDTO): Partial<Payment> {
    return {
      amount: dto.amount,
      paymentDate: dto.paymentDate,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      progressAtPayment: dto.progressAtPayment,
      transactionId: dto.transactionId,
      contractorId: dto.contractorId,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      checkNumber: dto.checkNumber,
      mobileNumber: dto.mobileNumber,
      receiverName: dto.receiverName,
      mobileOperator: dto.mobileOperator,
      status: dto.status as PaymentStatus | undefined,
      notes: dto.notes,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate payment data for business rules
   */
  static validatePaymentData(payment: Partial<Payment>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payment.amount || payment.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }
    if (!payment.paymentDate) {
      errors.push('Payment date is required');
    } else if (new Date(payment.paymentDate) > new Date()) {
      errors.push('Payment date cannot be in the future');
    }
    if (!payment.paymentMethod || payment.paymentMethod.trim() === '') {
      errors.push('Payment method is required');
    }
    if (!payment.contractorName || payment.contractorName.trim() === '') {
      errors.push('Contractor name is required');
    }
    if (payment.progressAtPayment !== undefined && (payment.progressAtPayment < 0 || payment.progressAtPayment > 100)) {
      errors.push('Progress at payment must be between 0 and 100');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate payment efficiency metrics
   */
  static calculatePaymentEfficiency(payments: Payment[]): PaymentEfficiencyResult {
    const totalPayments = payments.length;
    const onTimePayments = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      const dueDate = new Date(p.paymentDate);
      dueDate.setDate(dueDate.getDate() + 30);
      return paymentDate <= dueDate;
    }).length;

    const paymentRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0;
    const onTimePaymentRate = paymentRate >= 90 ? 'Excellent' : paymentRate >= 70 ? 'Good' : 'Poor';

    const daysOverdue = payments.reduce((total, payment) => {
      const paymentDate = new Date(payment.paymentDate);
      const dueDate = new Date(payment.paymentDate);
      dueDate.setDate(dueDate.getDate() + 30);
      return paymentDate > dueDate ? total + Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : total;
    }, 0);

    const averagePaymentDelay = totalPayments > 0 ? daysOverdue / totalPayments : 0;

    return {
      paymentRate,
      onTimePaymentRate,
      daysOverdue,
      averagePaymentDelay
    };
  }

  /**
   * Calculate payment risk assessment
   */
  static calculatePaymentRisk(payment: Payment): PaymentRiskResult {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    if (payment.status === 'failed' || payment.status === 'cancelled') {
      riskFactors.push('Payment has issues');
      recommendations.push('Review payment status and resolve issues');
    }
    if (payment.status === 'pending') {
      riskFactors.push('Payment is still processing');
      recommendations.push('Monitor payment progress');
    }
    if (payment.paymentMethod === 'cash') {
      riskFactors.push('Cash payment - higher risk');
      recommendations.push('Consider electronic payment methods');
    }
    if (payment.amount > 100000) {
      riskFactors.push('High payment amount');
      recommendations.push('Require additional approval for large payments');
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskFactors.length >= 3) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }

    let financialHealth = 'Good';
    if (riskLevel === 'high') {
      financialHealth = 'Poor';
    } else if (riskLevel === 'medium') {
      financialHealth = 'Fair';
    }

    return {
      riskLevel,
      riskFactors,
      recommendations,
      financialHealth
    };
  }

  /**
   * Calculate cash flow metrics
   */
  static calculateCashFlowMetrics(payments: Payment[]): CashFlowMetricsResult {
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDue = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const cashFlowVariance = totalDue > 0 ? ((totalPaid - totalDue) / totalDue) * 100 : 0;

    const efficiency = PaymentTransformer.calculatePaymentEfficiency(payments);

    return {
      totalPaid,
      totalDue,
      cashFlowVariance,
      averagePaymentDelay: efficiency.averagePaymentDelay,
      paymentEfficiency: efficiency
    };
  }

  /**
   * Check if payment is overdue
   */
  static isOverdue(payment: Payment): boolean {
    const paymentDate = new Date(payment.paymentDate);
    const dueDate = new Date(payment.paymentDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return paymentDate > dueDate && payment.status !== 'completed';
  }

  /**
   * Convert Payment to PaymentRequestDTO
   */
  static paymentToRequestDTO(payment: Payment): PaymentRequestDTO {
    return {
      id: payment.id,
      supplierId: payment.contractorName,
      projectId: payment.projectRef?.id ?? '',
      amount: payment.amount,
      description: '',
      paymentReason: '',
      status: payment.status as 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  static requestDTOToPayment(dto: PaymentRequestDTO): Payment {
    return Payment.create({
      id: dto.id,
      projectRef: dto.projectId ? { id: dto.projectId } : null,
      contractorName: dto.supplierId,
      contractorContact: '',
      amount: dto.amount,
      paymentMethod: 'bank_transfer' as PaymentMethod,
      progressAtPayment: 0
    });
  }

  // ============================================================
  // Interface EntityToDTOMapper
  // ============================================================

  toDTO(entity: Payment): PaymentDTO {
    return PaymentTransformer.toDTO(entity);
  }

  fromDTO(dto: PaymentDTO): Payment {
    return PaymentTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Payment): PaymentDTO {
    return PaymentTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: PaymentDTO[]): PaymentDTO[] {
    return dtos;
  }

  toResponseDto(entity: Payment): PaymentDTO {
    return PaymentTransformer.toDTO(entity);
  }

  toRequestDto(dto: PaymentDTO): PaymentDTO {
    return dto;
  }

  toUpdateDto(dto: PaymentDTO): Partial<PaymentDTO> {
    return {
      amount: dto.amount,
      paymentDate: dto.paymentDate,
      paymentMethod: dto.paymentMethod,
      status: dto.status,
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
      notes: dto.notes,
    };
  }

  validate(dto: PaymentDTO): ValidationResult {
    const payment = PaymentTransformer.toEntity(dto);
    const validation = PaymentTransformer.validatePaymentData(payment);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Payment[]): PaymentDTO[] {
    return entities.map(entity => PaymentTransformer.toDTO(entity));
  }

  toEntities(dtos: PaymentDTO[]): Payment[] {
    return dtos.map(dto => PaymentTransformer.toEntity(dto));
  }

  static toDomain(dto: PaymentDTO | any): Payment {
    const payload = {
      ...dto,
      projectId: dto.projectId || dto.project_id || (dto.project && typeof dto.project === 'object' ? dto.project.id : ''),
      contractorId: dto.contractorId || dto.contractor_id || '',
    };
    return this.toEntity(payload);
  }

  static manyFromDTO(dtos: PaymentDTO[]): Payment[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  static toDTOs(payments: Payment[]): PaymentDTO[] {
    return payments.map(payment => this.toDTO(payment));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Payment[] {
    return rows.map(row => PaymentTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Payment {
    return Payment.create({
      id: row.id as string,
      projectRef: row.project_id ? { id: row.project_id as string } : null,
      phaseRef: row.phase_id ? { id: row.phase_id as string } : null,
      inspectionRef: row.inspection_id ? { id: row.inspection_id as string } : null,
      amount: Number(row.amount),
      paymentMethod: row.payment_method as PaymentMethod,
      contractorName: row.contractor_name as string,
      contractorContact: row.contractor_contact as string,
      progressAtPayment: Number(row.progress_at_payment) || 0
    });
  }
  /**
   * Transform Payment entity to PaymentDTO with project context
   * (used by components that need project name alongside payment)
   */
  static toDTOWithProjectContext(payment: Payment, projectContext: { id: string; name: string }): PaymentDTO {
    const dto = PaymentTransformer.toDTO(payment);
    return {
      ...dto,
      projectName: projectContext.name,
      projectRef: { id: projectContext.id },
    };
  }
  /**
   * Payment Method-Specific Validation
   */
  static validatePaymentMethod(dto: Partial<PaymentDTO>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    requiredFields: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const requiredFields: string[] = [];

    const method = dto.paymentMethod;
    const amount = dto.amount;

    if (!method) {
      errors.push('Payment method is required');
      return { isValid: false, errors, warnings, requiredFields };
    }

    if (!amount || amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    switch (method) {
      case 'bank_transfer': {
        requiredFields.push('bankName', 'accountNumber');
        if (!dto.bankName?.trim()) errors.push('Bank name is required for bank transfers');
        if (!dto.accountNumber?.trim()) errors.push('Account number is required for bank transfers');
        if (amount && amount > 100000) warnings.push('Large bank transfer - consider additional approval');
        break;
      }
      case 'cash': {
        requiredFields.push('receiverName');
        if (!dto.receiverName?.trim()) errors.push('Receiver name is required for cash payments');
        if (amount && amount > 5000) warnings.push('Large cash payment - consider electronic methods');
        break;
      }
      case 'check': {
        requiredFields.push('checkNumber', 'bankName');
        if (!dto.checkNumber?.trim()) errors.push('Check number is required for check payments');
        if (!dto.bankName?.trim()) errors.push('Bank name is required for check payments');
        break;
      }
      case 'mobile_payment': {
        requiredFields.push('mobileNumber', 'mobileOperator', 'receiverName');
        if (!dto.mobileNumber?.trim()) errors.push('Mobile number is required for mobile payments');
        if (!dto.mobileOperator?.trim()) errors.push('Mobile operator is required for mobile payments');
        if (!dto.receiverName?.trim()) errors.push('Receiver name is required for mobile payments');
        break;
      }
      default: {
        errors.push(`Unsupported payment method: ${method}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredFields
    };
  }

  /**
   * File Upload Processing for Payments
   */
  static processPaymentFiles(dto: Partial<PaymentDTO>): {
    receiptUrl?: string;
    invoiceUrl?: string;
    hasRequiredDocuments: boolean;
    missingDocuments: string[];
  } {
    const receiptUrl = (dto as any).documents?.find((doc: string) => doc.includes('receipt')) || '';
    const invoiceUrl = (dto as any).documents?.find((doc: string) => doc.includes('invoice')) || '';

    const missingDocuments: string[] = [];
    let hasRequiredDocuments = true;

    if (!receiptUrl) {
      missingDocuments.push('receipt');
      hasRequiredDocuments = false;
    }
    if (!invoiceUrl) {
      missingDocuments.push('invoice');
      hasRequiredDocuments = false;
    }

    return {
      receiptUrl,
      invoiceUrl,
      hasRequiredDocuments,
      missingDocuments
    };
  }

  /**
   * Payment Blocking Logic
   */
  static validatePaymentBlocking(dto: PaymentDTO, projectContext?: Record<string, unknown>): {
    canProceed: boolean;
    blockingReasons: string[];
    warningReasons: string[];
    requiredActions: string[];
  } {
    const blockingReasons: string[] = [];
    const warningReasons: string[] = [];
    const requiredActions: string[] = [];

    if (dto.amount && dto.amount > 500000) {
      blockingReasons.push('Payment amount exceeds maximum limit');
      requiredActions.push('Obtain director approval');
    }
    if (dto.progressAtPayment && (dto.progressAtPayment < 0 || dto.progressAtPayment > 100)) {
      blockingReasons.push('Invalid progress percentage');
    }
    if (!dto.contractorId && !dto.contractorName) {
      blockingReasons.push('Contractor information is required');
    }
    if (!dto.projectId) {
      blockingReasons.push('Project information is required');
    }

    const fileValidation = PaymentTransformer.processPaymentFiles(dto);
    if (!fileValidation.hasRequiredDocuments) {
      blockingReasons.push(`Missing required documents: ${fileValidation.missingDocuments.join(', ')}`);
      requiredActions.push('Upload missing documents');
    }

    const methodValidation = PaymentTransformer.validatePaymentMethod(dto);
    if (!methodValidation.isValid) {
      blockingReasons.push(...methodValidation.errors);
    }

    if (dto.amount && dto.amount > 100000) {
      warningReasons.push('Large payment amount - additional review recommended');
      requiredActions.push('Schedule additional review');
    }
    if (!dto.transactionId) {
      warningReasons.push('Transaction ID not provided - tracking may be difficult');
    }

    return {
      canProceed: blockingReasons.length === 0,
      blockingReasons,
      warningReasons,
      requiredActions
    };
  }

  /**
   * Enhanced Payment Creation with Validation
   */
  static createPaymentWithValidation(dto: CreatePaymentDTO, projectContext?: Record<string, unknown>): {
    payment: Payment;
    validation: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
      canProceed: boolean;
      blockingReasons: string[];
      requiredActions: string[];
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const fullDTO: PaymentDTO = {
      ...dto,
      id: (dto as any).id || crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const methodValidation = PaymentTransformer.validatePaymentMethod(fullDTO);
    const blockingValidation = PaymentTransformer.validatePaymentBlocking(fullDTO, projectContext);

    errors.push(...methodValidation.errors);
    warnings.push(...methodValidation.warnings, ...blockingValidation.warningReasons);

    const payment = PaymentTransformer.fromCreateDTOToEntity(dto);

    return {
      payment,
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
        canProceed: blockingValidation.canProceed,
        blockingReasons: blockingValidation.blockingReasons,
        requiredActions: blockingValidation.requiredActions
      }
    };
  }

  /**
   * Payment Status Workflow Management
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    allowedTransitions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const statusTransitions: Record<string, string[]> = {
      'pending': ['processing', 'approved', 'cancelled'],
      'processing': ['completed', 'failed', 'cancelled'],
      'approved': ['processing', 'cancelled'],
      'completed': ['cancelled'],
      'failed': ['pending', 'cancelled'],
      'cancelled': []
    };

    const allowedTransitions = statusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    if (currentStatus === 'completed' && newStatus === 'cancelled') {
      warnings.push('Cancelling a completed payment - ensure proper reversal procedures');
    }
    if (currentStatus === 'failed' && newStatus === 'completed') {
      warnings.push('Marking failed payment as completed - verify payment actually succeeded');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      allowedTransitions
    };
  }

  /**
   * Bulk Payment Processing
   */
  static processBulkPayments(dtos: CreatePaymentDTO[], projectContext?: Record<string, unknown>): {
    payments: Payment[];
    results: Array<{
      index: number;
      success: boolean;
      errors: string[];
      warnings: string[];
      canProceed: boolean;
      blockingReasons: string[];
      requiredActions: string[];
    }>;
  } {
    const payments: Payment[] = [];
    const results: Array<{
      index: number;
      success: boolean;
      errors: string[];
      warnings: string[];
      canProceed: boolean;
      blockingReasons: string[];
      requiredActions: string[];
    }> = [];

    dtos.forEach((dto, index) => {
      try {
        const { payment, validation } = PaymentTransformer.createPaymentWithValidation(dto, projectContext);

        if (validation.isValid && validation.canProceed) {
          payments.push(payment);
          results.push({
            index,
            success: true,
            errors: [],
            warnings: validation.warnings,
            canProceed: true,
            blockingReasons: [],
            requiredActions: validation.requiredActions
          });
        } else {
          results.push({
            index,
            success: false,
            errors: validation.errors,
            warnings: validation.warnings,
            canProceed: validation.canProceed,
            blockingReasons: validation.blockingReasons,
            requiredActions: validation.requiredActions
          });
        }
      } catch (error) {
        results.push({
          index,
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
          canProceed: false,
          blockingReasons: ['Processing error'],
          requiredActions: ['Review and retry']
        });
      }
    });

    return { payments, results };
  }

  /**
   * Payment Analytics Generation
   */
  static generatePaymentAnalytics(payments: PaymentDTO[]): {
    totalPayments: number;
    totalAmount: number;
    averagePaymentAmount: number;
    paymentsByMethod: Record<string, { count: number; amount: number }>;
    paymentsByStatus: Record<string, { count: number; amount: number }>;
    overduePayments: number;
    blockedPayments: number;
    completionRate: number;
    riskScore: number;
  } {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const averagePaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    const paymentsByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      if (!acc[method]) acc[method] = { count: 0, amount: 0 };
      acc[method].count++;
      acc[method].amount += payment.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const paymentsByStatus = payments.reduce((acc, payment) => {
      const status = payment.status || 'unknown';
      if (!acc[status]) acc[status] = { count: 0, amount: 0 };
      acc[status].count++;
      acc[status].amount += payment.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const overduePayments = payments.filter(p =>
      p.paymentDate && new Date(p.paymentDate) < new Date() &&
      (p.status === 'pending')
    ).length;

    const blockedPayments = payments.filter(p => p.status === 'blocked').length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    const riskScore = Math.min(100,
      (overduePayments * 10) +
      (blockedPayments * 20) +
      ((100 - completionRate) * 0.5)
    );

    return {
      totalPayments,
      totalAmount,
      averagePaymentAmount,
      paymentsByMethod,
      paymentsByStatus,
      overduePayments,
      blockedPayments,
      completionRate,
      riskScore
    };
  }
}