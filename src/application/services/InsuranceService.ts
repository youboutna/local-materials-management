/**
 * Insurance Service - Hexagonal Architecture
 * Business logic for insurance certificate management
 */

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface InsuranceCertificate {
  id: string;
  project_id: string;
  contractor_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  coverage_amount: number;
  start_date: string;
  valid_until: string;
  status: 'active' | 'expired' | 'pending';
  documents: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateInsuranceData {
  project_id: string;
  contractor_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  coverage_amount: number;
  start_date: string;
  valid_until: string;
  status: 'active' | 'expired' | 'pending';
  documents?: string[];
  notes?: string;
}

export interface UpdateInsuranceData {
  status?: string;
  notes?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class InsuranceService {
  private repository: any;

  constructor() {
    this.repository = RepositoryFactory.getInsuranceRepository();
  }

  /**
   * Get insurance certificates for a project
   */
  async getInsuranceCertificates(projectId?: string): Promise<InsuranceCertificate[]> {
    try {
      console.log('Getting insurance certificates for project:', projectId);
      return [];
    } catch (error) {
      console.error('Error getting insurance certificates:', error);
      return [];
    }
  }

  /**
   * Create new insurance certificate
   */
  async createInsuranceCertificate(data: CreateInsuranceData): Promise<InsuranceCertificate> {
    try {
      console.log('Creating insurance certificate:', data);
      throw new Error('Not implemented yet');
    } catch (error) {
      console.error('Error creating insurance certificate:', error);
      throw error;
    }
  }

  /**
   * Update insurance certificate
   */
  async updateInsuranceCertificate(id: string, data: UpdateInsuranceData): Promise<InsuranceCertificate> {
    try {
      console.log('Updating insurance certificate:', id, data);
      throw new Error('Not implemented yet');
    } catch (error) {
      console.error('Error updating insurance certificate:', error);
      throw error;
    }
  }

  /**
   * Delete insurance certificate
   */
  async deleteInsuranceCertificate(id: string): Promise<boolean> {
    try {
      console.log('Deleting insurance certificate:', id);
      return true;
    } catch (error) {
      console.error('Error deleting insurance certificate:', error);
      return false;
    }
  }

  /**
   * Upload insurance document
   */
  async uploadInsuranceDocument(file: File, certificateId: string): Promise<DocumentUploadResult> {
    try {
      console.log('Uploading insurance document:', file.name, certificateId);
      return {
        success: false,
        error: 'Upload not implemented yet'
      };
    } catch (error: unknown) {
      console.error('Error uploading insurance document:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Validate insurance certificate data
   */
  validateInsuranceData(data: Partial<CreateInsuranceData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.project_id) {
      errors.push('Le projet est requis');
    }

    if (!data.insurance_type) {
      errors.push('Le type d\'assurance est requis');
    }

    if (!data.provider) {
      errors.push('Le fournisseur est requis');
    }

    if (!data.policy_number) {
      errors.push('Le numéro de police est requis');
    }

    if (!data.coverage_amount || data.coverage_amount <= 0) {
      errors.push('Le montant de couverture doit être positif');
    }

    if (!data.start_date) {
      errors.push('La date de début est requise');
    }

    if (!data.valid_until) {
      errors.push('La date de fin est requise');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if insurance certificate is expiring soon
   */
  isExpiringSoon(certificate: InsuranceCertificate, daysThreshold: number = 30): boolean {
    const endDate = new Date(certificate.valid_until);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
  }

  /**
   * Get insurance statistics for a project
   */
  async getInsuranceStatistics(projectId: string): Promise<{
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    expiringSoonCertificates: number;
    totalCoverage: number;
  }> {
    try {
      const certificates = await this.getInsuranceCertificates(projectId);
      
      const activeCertificates = certificates.filter(c => c.status === 'active').length;
      const expiredCertificates = certificates.filter(c => c.status === 'expired').length;
      const expiringSoonCertificates = certificates.filter(c => this.isExpiringSoon(c)).length;
      const totalCoverage = certificates.reduce((sum, c) => sum + c.coverage_amount, 0);

      return {
        totalCertificates: certificates.length,
        activeCertificates,
        expiredCertificates,
        expiringSoonCertificates,
        totalCoverage
      };
    } catch (error) {
      console.error('Error getting insurance statistics:', error);
      return {
        totalCertificates: 0,
        activeCertificates: 0,
        expiredCertificates: 0,
        expiringSoonCertificates: 0,
        totalCoverage: 0
      };
    }
  }

  /**
   * Static methods for backward compatibility
   */
  static async getCertificates(projectId?: string): Promise<InsuranceCertificate[]> {
    const service = new InsuranceService();
    return await service.getInsuranceCertificates(projectId);
  }

  static async createCertificate(data: CreateInsuranceData): Promise<InsuranceCertificate | null> {
    const service = new InsuranceService();
    return await service.createInsuranceCertificate(data);
  }

  static async updateCertificate(id: string, data: UpdateInsuranceData): Promise<InsuranceCertificate | null> {
    const service = new InsuranceService();
    return await service.updateInsuranceCertificate(id, data);
  }

  static async deleteCertificate(id: string): Promise<boolean> {
    const service = new InsuranceService();
    return await service.deleteInsuranceCertificate(id);
  }

  static async uploadDocument(file: File, certificateId: string): Promise<DocumentUploadResult> {
    const service = new InsuranceService();
    return await service.uploadInsuranceDocument(file, certificateId);
  }

  static validateData(data: Partial<CreateInsuranceData>): { isValid: boolean; errors: string[] } {
    const service = new InsuranceService();
    return service.validateInsuranceData(data);
  }

  static isExpiringSoon(certificate: InsuranceCertificate, daysThreshold: number = 30): boolean {
    const service = new InsuranceService();
    return service.isExpiringSoon(certificate, daysThreshold);
  }

  static async getStatistics(projectId: string): Promise<{
    totalCertificates: number;
    activeCertificates: number;
    expiredCertificates: number;
    expiringSoonCertificates: number;
    totalCoverage: number;
  }> {
    const service = new InsuranceService();
    return await service.getInsuranceStatistics(projectId);
  }
}
