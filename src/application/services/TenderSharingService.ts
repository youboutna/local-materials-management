// src/application/services/TenderSharingService.ts
// Service for secure tender document sharing with ACID principles
import { ITenderSharingRepository } from '@/domain/repositories';
import {
  CreateAccessLogDTO,
  CreateSharingSecretDTO,
  TenderSharingSecretDTO,
  ValidateSecretResponseDTO
} from '@/dtos/entities/tender-sharing-dto';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { CommunicationService } from './CommunicationService';

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
   * Partage direct d'un code secret avec un fournisseur.
   * Envoi de l'e-mail via CommunicationService (qui utilise l'adaptateur de notification)
   * puis journalisation.
   * CORRIGÉ : ajout de recipientId (UUID) et senderName pour la notification interne.
   */
  static async shareWithSupplier(params: {
    tenderId: string;
    tenderTitle: string;
    secretCode: string;
    secretId?: string;
    supplierEmail: string;
    supplierName?: string;
    recipientId?: string;    // UUID du fournisseur (pour notification interne)
    senderName?: string;    // Nom de l'émetteur
    senderEmail?: string;   // Email de l'émetteur (pour logs)
    senderId?: string;      // UUID de l'émetteur (pour logs)
    expiresAt?: string | null;
    message?: string;
  }): Promise<void> {
    const portalUrl = `${window.location.origin}/supplier-secure-access?code=${encodeURIComponent(params.secretCode)}`;
    const expiry = params.expiresAt
      ? new Date(params.expiresAt).toLocaleDateString('fr-FR')
      : 'sans date limite';

    const body = [
      `Bonjour ${params.supplierName ?? ''}`.trim() + ',',
      '',
      `${params.senderName ? `M. ${params.senderName}` : 'Le responsable'} vous a partagé un accès sécurisé pour l'appel d'offres « ${params.tenderTitle} ».`,
      '',
      `Code d'accès : ${params.secretCode}`,
      `Lien d'accès : ${portalUrl}`,
      `Validité : ${expiry}`,
      params.message ? `\n${params.message}` : '',
      '',
      'Ce code est personnel et son utilisation est journalisée.',
    ].join('\n');

    // --- LOG DÉTAILLÉ AVANT ENVOI ---
    console.log('[TenderSharingService] Partage sécurisé :', {
      timestamp: new Date().toISOString(),
      tenderId: params.tenderId,
      tenderTitle: params.tenderTitle,
      secretId: params.secretId,
      secretCode: params.secretCode,
      supplierName: params.supplierName,
      supplierEmail: params.supplierEmail,
      recipientId: params.recipientId || 'non fourni',
      senderName: params.senderName,
      senderEmail: params.senderEmail || 'non fourni',
      expiresAt: params.expiresAt,
      message: params.message || 'non fourni',
    });

    // Envoyer l'email via CommunicationService
    await CommunicationService.sendEmail({
      to: params.supplierEmail,
      subject: `Accès sécurisé — ${params.tenderTitle}`,
      message: body,
      priority: 'high',
      actionType: 'tender_secret_shared',
      metadata: {
        tenderId: params.tenderId,
        secretId: params.secretId,
        secretCode: params.secretCode,
        supplierEmail: params.supplierEmail,
        supplierName: params.supplierName,
        recipientId: params.recipientId, // UUID pour notification
        senderName: params.senderName,
        senderEmail: params.senderEmail,
        senderId: params.senderId,
        expiresAt: params.expiresAt,
        message: params.message,
        // Vérifier si l'email modifié diffère de l'email officiel
        isEmailModified: params.recipientId 
          ? await this.isSupplierEmailDifferent(params.recipientId, params.supplierEmail)
          : false,
        originalSupplierEmail: params.recipientId 
          ? await this.getSupplierEmailById(params.recipientId) 
          : null,
      },
    });

    // Journalisation dans la base (log Access)
    try {
      if (params.secretId) {
        await this.logAccess({
          sharingSecretId: params.secretId,
          accessedAt: new Date().toISOString(),
          accessedBy: params.supplierEmail,
          sharedBy: params.senderEmail ?? null,
          actionType: 'share',

          metadata: {
            channel: 'email',
            supplierName: params.supplierName ?? null,
            senderName: params.senderName ?? null,
            senderEmail: params.senderEmail ?? null,
            senderId: params.senderId ?? null,
            recipientId: params.recipientId ?? null,
            isEmailModified: params.recipientId 
              ? await this.isSupplierEmailDifferent(params.recipientId, params.supplierEmail)
              : false,
            originalSupplierEmail: params.recipientId 
              ? await this.getSupplierEmailById(params.recipientId) 
              : null,
            secretCode: params.secretCode,
            tenderId: params.tenderId,
            tenderTitle: params.tenderTitle,
            expiresAt: params.expiresAt,
            message: params.message,
          },
        });
      }
    } catch {
      // non bloquant
    }
  }

  /**
   * Vérifie si l'email saisi diffère de l'email officiel du fournisseur
   */
  private static async isSupplierEmailDifferent(supplierId: string, currentEmail: string): Promise<boolean> {
    try {
      const originalEmail = await this.getSupplierEmailById(supplierId);
      return originalEmail !== currentEmail;
    } catch {
      return false;
    }
  }

  /**
   * Récupère l'email officiel d'un fournisseur par son UUID
   */
  private static async getSupplierEmailById(supplierId: string): Promise<string | null> {
    try {
      const repo = RepositoryFactory.getSupplierRepository();
      const supplier = await repo.findById(supplierId);
      return supplier?.email || null;
    } catch {
      return null;
    }
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