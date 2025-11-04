// Service for Supplier Payment Requests
import { SupplierPaymentRepository } from './SupplierPaymentRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface CreatePaymentRequestDTO {
  supplier_id: string;
  project_id: string;
  amount: number;
  description: string;
  payment_reason: 'progress_payment' | 'inspection_fee' | 'final_payment' | 'other';
  status?: 'pending' | 'approved' | 'rejected' | 'paid';
  notes?: string;
}

export class SupplierPaymentService {
  private static repository = new SupplierPaymentRepository();

  /**
   * Create a payment request
   */
  static async createPaymentRequest(requestData: CreatePaymentRequestDTO) {
    try {
      return await this.repository.createPaymentRequest({
        ...requestData,
        requested_date: new Date().toISOString(),
        status: requestData.status || 'pending'
      });
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création de la demande de paiement'
      );
    }
  }

  /**
   * Create payment request for contractor (progress payment)
   */
  static async createContractorProgressPayment(
    projectId: string,
    amount: number,
    inspectionId: string,
    progress: number,
    documentsCount: number,
    description?: string
  ) {
    try {
      // Get contractor supplier ID
      const contractorSupplierId = await this.repository.getContractorSupplierIdForProject(projectId);
      
      if (!contractorSupplierId) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Aucun entrepreneur trouvé pour ce projet'
        );
      }

      return await this.createPaymentRequest({
        supplier_id: contractorSupplierId,
        project_id: projectId,
        amount,
        description: description || `Décompte de paiement - Avancement: ${progress}%`,
        payment_reason: 'progress_payment',
        notes: `Inspection ID: ${inspectionId}\nDocuments: ${documentsCount} fichier(s)\nAvancement: ${progress}%`
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating contractor payment:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création du paiement entrepreneur'
      );
    }
  }

  /**
   * Create payment request for inspector fees
   */
  static async createInspectorFeePayment(
    supplierId: string,
    projectId: string,
    amount: number,
    inspectionId: string,
    inspectionDate: string,
    description?: string
  ) {
    try {
      return await this.createPaymentRequest({
        supplier_id: supplierId,
        project_id: projectId,
        amount,
        description: description || `Frais d'inspection - Mission du ${new Date(inspectionDate).toLocaleDateString('fr-FR')}`,
        payment_reason: 'inspection_fee',
        notes: `Inspection ID: ${inspectionId}\nType: Frais de mission / Honoraires ingénieur conseil`
      });
    } catch (error) {
      console.error('Error creating inspector fee payment:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la création du paiement inspecteur'
      );
    }
  }

  /**
   * Get payment requests by project
   */
  static async getPaymentRequestsByProject(projectId: string) {
    try {
      return await this.repository.findByProjectId(projectId);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des demandes de paiement'
      );
    }
  }

  /**
   * Get payment requests by supplier
   */
  static async getPaymentRequestsBySupplier(supplierId: string) {
    try {
      return await this.repository.findBySupplierId(supplierId);
    } catch (error) {
      console.error('Error fetching supplier payment requests:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des paiements du fournisseur'
      );
    }
  }

  /**
   * Update payment request status
   */
  static async updatePaymentStatus(
    requestId: string,
    status: 'pending' | 'approved' | 'rejected' | 'paid'
  ) {
    try {
      return await this.repository.updateStatus(requestId, status);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la mise à jour du statut de paiement'
      );
    }
  }
}
