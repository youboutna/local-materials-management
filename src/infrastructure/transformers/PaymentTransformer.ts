// @ts-nocheck
/**
 * Payment Transformer
 * Maps between Supabase data, Domain entities, and DTOs
 * Following hexagonal architecture principles
 */

import { Payment } from '@/domain/entities/Payment';

// DTOs d'API (Adapter Layer)
export class PaymentResponseDto {
  constructor(
    public id: string,
    public projectId: string,
    public phaseId?: string,
    public stepId?: string,
    public inspectionId?: string,
    public paymentId?: string,
    public amount: number,
    public paymentDate: string,
    public paymentMethod: string,
    public status: string,
    public progressAtPayment?: number,
    public transactionId?: string,
    public contractorName?: string,
    public contractorContact?: string,
    public bankName?: string,
    public bankAccount?: string,
    public bankIban?: string,
    public bankSwift?: string,
    public documents?: string[],
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class CreatePaymentRequestDto {
  constructor(
    public projectId: string,
    public phaseId?: string,
    public stepId?: string,
    public inspectionId?: string,
    public amount: number,
    public paymentDate: string,
    public paymentMethod: string,
    public contractorName?: string,
    public contractorContact?: string,
    public bankName?: string,
    public bankAccount?: string,
    public bankIban?: string,
    public bankSwift?: string,
    public documents?: string[]
  ) {}
}

export class UpdatePaymentRequestDto {
  constructor(
    public amount?: number,
    public paymentDate?: string,
    public paymentMethod?: string,
    public status?: string,
    public progressAtPayment?: number,
    public transactionId?: string,
    public contractorName?: string,
    public contractorContact?: string,
    public bankName?: string,
    public bankAccount?: string,
    public bankIban?: string,
    public bankSwift?: string,
    public documents?: string[]
  ) {}
}

// Transformer (Adapter Layer)
export class PaymentTransformer {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabasePayment: any): Payment {
    return new Payment(
      supabasePayment.id,
      supabasePayment.project_id,
      supabasePayment.phase_id || null,
      supabasePayment.step_id || null,
      supabasePayment.inspection_id || null,
      supabasePayment.payment_id || null,
      supabasePayment.amount,
      new Date(supabasePayment.payment_date),
      supabasePayment.payment_method,
      supabasePayment.status,
      supabasePayment.progress_at_payment || null,
      supabasePayment.transaction_id || null,
      supabasePayment.contractor_name || null,
      supabasePayment.contractor_contact || null,
      supabasePayment.bank_name || null,
      supabasePayment.bank_account || null,
      supabasePayment.bank_iban || null,
      supabasePayment.bank_swift || null,
      supabasePayment.documents || [],
      new Date(supabasePayment.created_at),
      new Date(supabasePayment.updated_at)
    );
  }

  /**
   * Transforme l'entité du domaine vers le DTO de réponse API
   */
  static toResponseDto(payment: Payment): PaymentResponseDto {
    return new PaymentResponseDto(
      payment.id,
      payment.projectId,
      payment.phaseId,
      payment.stepId,
      payment.inspectionId,
      payment.paymentId,
      payment.amount,
      payment.paymentDate.toISOString(),
      payment.paymentMethod,
      payment.status,
      payment.progressAtPayment,
      payment.transactionId,
      payment.contractorName,
      payment.contractorContact,
      payment.bankName,
      payment.bankAccount,
      payment.bankIban,
      payment.bankSwift,
      payment.documents,
      payment.createdAt.toISOString(),
      payment.updatedAt.toISOString()
    );
  }

  /**
   * Transforme le DTO de requête vers l'entité du domaine
   */
  static toDomainFromCreateDto(requestDto: CreatePaymentRequestDto): Payment {
    return new Payment(
      crypto.randomUUID(), // ID généré
      requestDto.projectId,
      requestDto.phaseId || null,
      requestDto.stepId || null,
      requestDto.inspectionId || null,
      null, // paymentId
      requestDto.amount,
      new Date(requestDto.paymentDate),
      requestDto.paymentMethod,
      'pending', // Statut initial
      null, // progressAtPayment
      null, // transactionId
      requestDto.contractorName || null,
      requestDto.contractorContact || null,
      requestDto.bankName || null,
      requestDto.bankAccount || null,
      requestDto.bankIban || null,
      requestDto.bankSwift || null,
      requestDto.documents || [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Transforme le DTO de mise à jour vers les données partielles de l'entité
   */
  static toUpdateData(requestDto: UpdatePaymentRequestDto): Partial<Payment> {
    return {
      amount: requestDto.amount,
      paymentDate: requestDto.paymentDate ? new Date(requestDto.paymentDate) : undefined,
      paymentMethod: requestDto.paymentMethod,
      status: requestDto.status,
      progressAtPayment: requestDto.progressAtPayment,
      transactionId: requestDto.transactionId,
      contractorName: requestDto.contractorName,
      contractorContact: requestDto.contractorContact,
      bankName: requestDto.bankName,
      bankAccount: requestDto.bankAccount,
      bankIban: requestDto.bankIban,
      bankSwift: requestDto.bankSwift,
      documents: requestDto.documents,
      updatedAt: new Date().toISOString()
    } as Partial<Payment>;
  }

  /**
   * Transforme un tableau de données Supabase vers les entités du domaine
   */
  static toDomainArray(supabasePayments: any[]): Payment[] {
    return supabasePayments.map(payment => PaymentTransformer.toDomain(payment));
  }

  /**
   * Transforme un tableau d'entités du domaine vers les DTOs de réponse
   */
  static toResponseDtoArray(payments: Payment[]): PaymentResponseDto[] {
    return payments.map(payment => PaymentTransformer.toResponseDto(payment));
  }
}
