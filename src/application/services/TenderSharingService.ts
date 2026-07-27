// Service for secure tender document sharing with ACID principles
import { ITenderSharingRepository } from '@/domain/repositories';
import {
    CreateAccessLogDTO,
    CreateSharingSecretDTO,
    TenderSharingSecretDTO,
    ValidateSecretResponseDTO
} from '@/dtos/entities/tender-sharing-dto';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

/**
 * Service for managing secure tender document sharing
 * Implements hexagonal architecture with repository pattern
 */
export class TenderSharingService {
  private static getRepository(): ITenderSharingRepository {
    return RepositoryFactory.getTenderSharingRepository();
  }

  /**
   * Generate a unique secret code for tender sharing
   */
  static async generateSecretCode(): Promise<string> {
    return await this.getRepository().generateSecretCode();
  }

  /**
   * Create a new sharing secret for tender documents
   * ACID compliant transaction
   */
  static async createSharingSecret(
    dto: CreateSharingSecretDTO
  ): Promise<TenderSharingSecretDTO> {
    return await this.getRepository().createSharingSecret(dto);
  }

  /**
   * Validate a secret code and check access permissions
   */
  static async validateSecret(
    secretCode: string,
    supplierEmail: string
  ): Promise<ValidateSecretResponseDTO> {
    return await this.getRepository().validateSecret(secretCode);
  }

  /**
   * Log access to shared documents
   */
  static async logAccess(dto: CreateAccessLogDTO): Promise<void> {
    await this.getRepository().createAccessLog(dto);
  }

  /**
   * Get access logs for a secret
   */
  static async getAccessLogs(secretCode: string): Promise<unknown[]> {
    return await this.getRepository().getAccessLogsBySecretCode(secretCode);
  }

  /**
   * Get active sharing secrets for a tender
   */
  static async getTenderSharingSecrets(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    return await this.getRepository().getSharingSecretsByTenderId(tenderId);
  }

  /**
   * Revoke a sharing secret
   */
  static async revokeSecret(secretId: string): Promise<void> {
    await this.getRepository().revokeSecret(secretId);
  }

  /**
   * Update access count for a secret
   */
  static async incrementAccessCount(secretId: string): Promise<void> {
    await this.getRepository().incrementAccessCount(secretId);
  }

  /**
   * Get sharing statistics for a tender
   */
  static async getSharingStats(tenderId: string): Promise<{
    uniqueSuppliers: number;
    totalAccesses: number;
    activeSecrets: number;
  }> {
    return await this.getRepository().getAccessStatistics(tenderId);
  }

  /**
   * Fetch documents shared with suppliers for a given tender, optionally
   * restricted to a whitelist of document IDs (the gate's allowedDocuments).
   * Kept in the service layer so UI components never touch supabase directly.
   */
  static async getSharedDocuments(
    tenderId: string,
    allowedDocumentIds?: string[]
  ): Promise<Array<{
    id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    document_type?: string | null;
  }>> {
    const { btpClient: supabase } = await import('@/integrations/supabase/schema-clients');

    // First, look up the tender's project so we can include project-level docs.
    const { data: tenderRow } = await supabase
      .from('tenders')
      .select('project_id')
      .eq('id', tenderId)
      .single();

    let query = supabase
      .from('documents')
      .select('id, title, description, file_url, document_type')
      .eq('is_shared_with_suppliers', true);

    if (tenderRow?.project_id) {
      query = query.or(
        `metadata->>tender_id.eq.${tenderId},project_id.eq.${tenderRow.project_id}`
      );
    } else {
      query = query.eq('metadata->>tender_id', tenderId);
    }

    if (allowedDocumentIds && allowedDocumentIds.length > 0) {
      query = query.in('id', allowedDocumentIds);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('TenderSharingService.getSharedDocuments failed', error);
      return [];
    }
    return (data ?? [])
      .filter((d: any) => d && d.id && d.title)
      .map((d: any) => ({
        id: String(d.id),
        title: String(d.title),
        description: d.description ?? null,
        file_url: d.file_url ?? null,
        document_type: d.document_type ?? null,
      }));
  }
}


