/**
 * Payment Transformer - Hexagonal Architecture
 * Transforms between Payment entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from PaymentDomainTransformer
 */

import { Payment, PaymentMethod, PaymentStatus } from '@/domain/entities/Payment';
import { PaymentDTO, CreatePaymentDTO, UpdatePaymentDTO, PaymentRequestDTO } from '@/dtos/entities/PaymentDTO';
import { Project } from '@/domain/entities/Project';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

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
   * Converts domain entity to data transfer object for UI layer
  */
  static toDTO(entity: Payment): PaymentDTO {
    return {
      id: entity.id,
      projectId: entity.project?.id || '',
      contractorId: '', // Cannot resolve without project context
      contractorName: entity.contractorName,
      contractorContact: entity.contractorContact,
      amount: entity.amount,
      paymentDate: entity.paymentDate,
      paymentMethod: entity.paymentMethod,
      transactionId: entity.transactionId || '',
      progressAtPayment: entity.progressAtPayment,
      inspectionId: '', // Would need to extract from entity
      phaseId: entity.phase?.id || '',
      bankName: entity.bankName || '',
      accountNumber: entity.accountNumber || '',
      checkNumber: entity.checkNumber || '',
      mobileNumber: entity.mobileNumber || '',
      mobileOperator: entity.mobileOperator || '',
      receiverName: entity.receiverName || '',
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Transform Payment entity to PaymentDTO with project context for contractor resolution
   * (Domain Entity → DTO with relationship resolution)
   */
  static toDTOWithProjectContext(entity: Payment, project: Project): PaymentDTO {
    // Derive contractorId from project relationships (suppliers or employees)
    let contractorId = '';
    if (entity.contractorName) {
      // Try to find contractor in project suppliers first
      const supplier = project.suppliers?.find((s) => s.name === entity.contractorName);
      if (supplier) {
        contractorId = supplier.id;
      } else {
        // If not found in suppliers, try employees
        const employee = project.employees?.find((e) => e.fullName === entity.contractorName);
        if (employee) {
          contractorId = employee.id;
        }
      }
    }

    return {
      id: entity.id,
      projectId: entity.project?.id || '',
      contractorId: contractorId, // Now properly derived from project relationships
      contractorName: entity.contractorName,
      contractorContact: entity.contractorContact,
      amount: entity.amount,
      paymentDate: entity.paymentDate, // This exists in PaymentDTO
      paymentMethod: entity.paymentMethod,
      transactionId: entity.transactionId || '',
      progressAtPayment: entity.progressAtPayment,
      inspectionId: '', // Would need to extract from entity
      phaseId: entity.phase?.id || '',
      bankName: entity.bankName || '',
      accountNumber: entity.accountNumber || '',
      checkNumber: entity.checkNumber || '',
      mobileNumber: entity.mobileNumber || '',
      mobileOperator: entity.mobileOperator || '',
      receiverName: entity.receiverName || '',
      createdAt: entity.createdAt || new Date().toISOString(),
      updatedAt: entity.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Transform PaymentDTO to Payment entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: PaymentDTO): Payment {
    return Payment.create({
      id: dto.id,
      project: null, // Would need to fetch from project repository
      phase: null, // Would need to fetch from phase repository using dto.phaseId
      inspection: null, // Would need to fetch from inspection repository using dto.inspectionId
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod, // Proper enum conversion
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      progressAtPayment: dto.progressAtPayment
    });
  }

  /**
   * Transform CreatePaymentDTO to Payment entity
   */
  static fromCreateDTOToEntity(dto: CreatePaymentDTO): Payment {
    return Payment.create({
      id: (dto as any).id || '',
      project: null,
      phase: null,
      inspection: null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact || '',
      progressAtPayment: dto.progressAtPayment
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
      contractorName: dto.contractorName,
      contractorContact: dto.contractorContact,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      checkNumber: dto.checkNumber,
      mobileNumber: dto.mobileNumber,
      receiverName: dto.receiverName,
      mobileOperator: dto.mobileOperator,
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
      dueDate.setDate(dueDate.getDate() + 30); // Assume 30-day payment term
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
    
    // Check payment status - use valid PaymentStatus values
    if (payment.status === 'failed' || payment.status === 'cancelled') {
      riskFactors.push('Payment has issues');
      recommendations.push('Review payment status and resolve issues');
    }
    
    if (payment.status === 'pending' || payment.status === 'processing') {
      riskFactors.push('Payment is still processing');
      recommendations.push('Monitor payment progress');
    }
    
    // Check payment method risk
    if (payment.paymentMethod === 'cash') {
      riskFactors.push('Cash payment - higher risk');
      recommendations.push('Consider electronic payment methods');
    }
    
    // Check amount risk
    if (payment.amount > 100000) {
      riskFactors.push('High payment amount');
      recommendations.push('Require additional approval for large payments');
    }
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskFactors.length >= 3) {
      riskLevel = 'high';
    } else if (riskFactors.length >= 1) {
      riskLevel = 'medium';
    }
    
    // Financial health assessment
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
      .filter(p => p.status === 'pending' || p.status === 'processing')
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
    dueDate.setDate(dueDate.getDate() + 30); // Assume 30-day payment term
    return paymentDate > dueDate && payment.status !== 'completed';
  }

  /**
   * Convert Payment to PaymentRequestDTO
   */
  static paymentToRequestDTO(payment: Payment): PaymentRequestDTO {
    return {
      id: payment.id,
      supplierId: payment.contractorName, // Use contractorName as supplierId
      projectId: payment.project?.id || '', // Access through project relationship
      amount: payment.amount,
      description: '', // Payment entity doesn't have description
      paymentReason: '', // Payment entity doesn't have paymentReason
      status: payment.status as 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
  }

  static requestDTOToPayment(dto: PaymentRequestDTO): Payment {
    return Payment.create({
      id: dto.id,
      project: null,
      contractorName: dto.supplierId,
      contractorContact: '',
      amount: dto.amount,
      paymentMethod: 'bank_transfer' as PaymentMethod,
      progressAtPayment: 0
    });
  }

  // EntityToDTOMapper interface implementation
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
      mobileOperator: dto.mobileOperator
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

  /**
   * Convert DTO to domain entity (alias for toEntity)
   * Rule #3: from dtos->DB
   */
  static toDomain(dto: PaymentDTO | any): Payment {
    // Handle both camelCase and snake_case properties from DTO
    // Note: Payment domain entity may use different property names
    const payload = {
      ...dto,
      projectId: dto.projectId || dto.project_id || (dto.project && typeof dto.project === 'object' ? dto.project.id : ''),
      contractorId: dto.contractorId || dto.contractor_id || '',
    };
    return this.toEntity(payload);
  }

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: PaymentDTO[]): Payment[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Convert multiple domain entities to DTOs
   */
  static toDTOs(payments: Payment[]): PaymentDTO[] {
    return payments.map(payment => this.toDTO(payment));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Payment[] {
    return rows.map(row => PaymentTransformer.toEntityFromDatabaseRow(row));
  }

  /**
   * Convert database row to Payment entity
   */
  static toEntityFromDatabaseRow(row: Record<string, unknown>): Payment {
    return Payment.create({
      id: row.id as string,
      project: null, // Would need to fetch from project repository
      phase: null, // Would need to fetch from phase repository
      inspection: null, // Would need to fetch from inspection repository
      amount: Number(row.amount),
      paymentMethod: row.payment_method as PaymentMethod,
      contractorName: row.contractor_name as string,
      contractorContact: row.contractor_contact as string,
      progressAtPayment: Number(row.progress_at_payment) || 0
    });
  }

  /**
   * Payment Method-Specific Validation
   * Validates payment data based on payment method requirements
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

    // Basic validation
    if (!method) {
      errors.push('Payment method is required');
      return { isValid: false, errors, warnings, requiredFields };
    }

    if (!amount || amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    }

    // Method-specific validation
    switch (method) {
      case 'bank_transfer':
        requiredFields.push('bankName', 'accountNumber');
        if (!dto.bankName?.trim()) {
          errors.push('Bank name is required for bank transfers');
        }
        if (!dto.accountNumber?.trim()) {
          errors.push('Account number is required for bank transfers');
        }
        if (amount && amount > 100000) {
          warnings.push('Large bank transfer - consider additional approval');
        }
        break;

      case 'cash':
        requiredFields.push('receiverName');
        if (!dto.receiverName?.trim()) {
          errors.push('Receiver name is required for cash payments');
        }
        if (amount && amount > 5000) {
          warnings.push('Large cash payment - consider electronic methods');
        }
        break;

      case 'check':
        requiredFields.push('checkNumber', 'bankName');
        if (!dto.checkNumber?.trim()) {
          errors.push('Check number is required for check payments');
        }
        if (!dto.bankName?.trim()) {
          errors.push('Bank name is required for check payments');
        }
        break;

      case 'mobile_payment':
        requiredFields.push('mobileNumber', 'mobileOperator', 'receiverName');
        if (!dto.mobileNumber?.trim()) {
          errors.push('Mobile number is required for mobile payments');
        }
        if (!dto.mobileOperator?.trim()) {
          errors.push('Mobile operator is required for mobile payments');
        }
        if (!dto.receiverName?.trim()) {
          errors.push('Receiver name is required for mobile payments');
        }
        break;

      default:
        errors.push(`Unsupported payment method: ${method}`);
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
   * Processes receipt and invoice file uploads
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

    // Business rules for document requirements
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
   * Validates if payment can proceed based on blocking rules
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

    // Amount-based blocking
    if (dto.amount && dto.amount > 500000) {
      blockingReasons.push('Payment amount exceeds maximum limit');
      requiredActions.push('Obtain director approval');
    }

    // Progress validation
    if (dto.progressAtPayment && (dto.progressAtPayment < 0 || dto.progressAtPayment > 100)) {
      blockingReasons.push('Invalid progress percentage');
    }

    // Contractor validation
    if (!dto.contractorId && !dto.contractorName) {
      blockingReasons.push('Contractor information is required');
    }

    // Project validation
    if (!dto.projectId) {
      blockingReasons.push('Project information is required');
    }

    // Document validation
    const fileValidation = PaymentTransformer.processPaymentFiles(dto);
    if (!fileValidation.hasRequiredDocuments) {
      blockingReasons.push(`Missing required documents: ${fileValidation.missingDocuments.join(', ')}`);
      requiredActions.push('Upload missing documents');
    }

    // Payment method validation
    const methodValidation = PaymentTransformer.validatePaymentMethod(dto);
    if (!methodValidation.isValid) {
      blockingReasons.push(...methodValidation.errors);
    }

    // Warnings for large amounts
    if (dto.amount && dto.amount > 100000) {
      warningReasons.push('Large payment amount - additional review recommended');
      requiredActions.push('Schedule additional review');
    }

    // Warnings for incomplete information
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
   * Enhanced Payment Creation with Business Rules
   * Creates payment with full validation and blocking logic
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

    // Convert to full DTO for validation
    const fullDTO: PaymentDTO = {
      ...dto,
      id: (dto as any).id || crypto.randomUUID(),
      status: 'pending', // Default status for new payments
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Run all validations
    const methodValidation = PaymentTransformer.validatePaymentMethod(fullDTO);
    const blockingValidation = PaymentTransformer.validatePaymentBlocking(fullDTO, projectContext);

    // Aggregate results
    errors.push(...methodValidation.errors);
    warnings.push(...methodValidation.warnings, ...blockingValidation.warningReasons);

    // Create payment entity
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
   * Manages payment status transitions with business rules
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    allowedTransitions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Define allowed status transitions
    const statusTransitions: Record<string, string[]> = {
      'pending': ['processing', 'approved', 'cancelled'],
      'processing': ['completed', 'failed', 'cancelled'],
      'approved': ['processing', 'cancelled'],
      'completed': ['cancelled'], // Final state, only cancellation allowed
      'failed': ['pending', 'cancelled'], // Can retry or cancel
      'cancelled': [] // Final state
    };

    const allowedTransitions = statusTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Business rule warnings
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
   * Processes multiple payments with validation and blocking logic
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
   * Generates comprehensive payment analytics
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

    // Group by payment method
    const paymentsByMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      if (!acc[method]) acc[method] = { count: 0, amount: 0 };
      acc[method].count++;
      acc[method].amount += payment.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Group by status
    const paymentsByStatus = payments.reduce((acc, payment) => {
      const status = payment.status || 'unknown';
      if (!acc[status]) acc[status] = { count: 0, amount: 0 };
      acc[status].count++;
      acc[status].amount += payment.amount || 0;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Calculate metrics
    const overduePayments = payments.filter(p =>
      p.paymentDate && new Date(p.paymentDate) < new Date() &&
      (p.status === 'pending' || p.status === 'processing')
    ).length;

    const blockedPayments = payments.filter(p => p.status === 'blocked').length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    // Risk score based on overdue and blocked payments
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
