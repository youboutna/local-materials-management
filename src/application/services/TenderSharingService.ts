// Service for secure tender document sharing with ACID principles
import { supabase } from '@/integrations/supabase/client';
import { 
  TenderSharingSecretDTO, 
  CreateSharingSecretDTO, 
  CreateAccessLogDTO, 
  ValidateSecretResponseDTO 
} from '@/types/tender-sharing-dto';

/**
 * Service for managing secure tender document sharing
 * Implements separation of concerns and loose coupling with Supabase
 */
export class TenderSharingService {
  /**
   * Generate a unique secret code for tender sharing
   */
  static async generateSecretCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_tender_secret_code');
    
    if (error) {
      console.error('Error generating secret code:', error);
      throw new Error('Failed to generate secret code');
    }
    
    return data;
  }

  /**
   * Create a new sharing secret for tender documents
   * ACID compliant transaction
   */
  static async createSharingSecret(
    dto: CreateSharingSecretDTO
  ): Promise<TenderSharingSecretDTO> {
    const secretCode = await this.generateSecretCode();
    
    const { data, error } = await supabase
      .from('tender_sharing_secrets')
      .insert({
        tender_id: dto.tender_id,
        secret_code: secretCode,
        supplier_email: dto.supplier_email,
        supplier_id: dto.supplier_id,
        expires_at: dto.expires_at,
        max_access_count: dto.max_access_count || 10,
        workflow_phase: dto.workflow_phase,
        workflow_stage: dto.workflow_stage,
        allowed_document_ids: dto.allowed_document_ids,
        metadata: dto.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Validate a secret code and check access permissions
   */
  static async validateSecret(
    secretCode: string,
    supplierEmail: string
  ): Promise<ValidateSecretResponseDTO> {
    try {
      // Get the secret record
      const { data: secret, error: secretError } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('secret_code', secretCode)
        .eq('supplier_email', supplierEmail)
        .single();

      if (secretError) throw secretError;

      // Check if secret exists and is valid
      if (!secret) {
        return {
          valid: false,
          reason: 'Secret code not found or invalid email',
          tenderId: null,
          accessCount: 0,
          maxAccess: 0,
          expiresAt: null
        };
      }

      // Check if secret has expired
      const now = new Date();
      const expiresAt = new Date(secret.expires_at);
      
      if (now > expiresAt) {
        return {
          valid: false,
          reason: 'Secret code has expired',
          tenderId: secret.tender_id,
          accessCount: secret.access_count,
          maxAccess: secret.max_access_count,
          expiresAt: secret.expires_at
        };
      }

      // Check if access limit reached
      if (secret.access_count >= secret.max_access_count) {
        return {
          valid: false,
          reason: 'Access limit reached',
          tenderId: secret.tender_id,
          accessCount: secret.access_count,
          maxAccess: secret.max_access_count,
          expiresAt: secret.expires_at
        };
      }

      return {
        valid: true,
        reason: 'Valid secret code',
        tenderId: secret.tender_id,
        accessCount: secret.access_count,
        maxAccess: secret.max_access_count,
        expiresAt: secret.expires_at
      };
    } catch (error) {
      console.error('Error validating secret:', error);
      return {
        valid: false,
        reason: 'Error validating secret code',
        tenderId: null,
        accessCount: 0,
        maxAccess: 0,
        expiresAt: null
      };
    }
  }

  /**
   * Log access to shared documents
   */
  static async logAccess(dto: CreateAccessLogDTO): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_access_logs')
        .insert({
          secret_code: dto.secret_code,
          supplier_email: dto.supplier_email,
          supplier_id: dto.supplier_id,
          tender_id: dto.tender_id,
          access_time: new Date().toISOString(),
          ip_address: dto.ip_address,
          user_agent: dto.user_agent,
          documents_accessed: dto.documents_accessed,
          action: dto.action
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging access:', error);
      throw new Error('Failed to log access');
    }
  }

  /**
   * Get access logs for a secret
   */
  static async getAccessLogs(secretCode: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from('tender_access_logs')
        .select('*')
        .eq('secret_code', secretCode)
        .order('access_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting access logs:', error);
      throw new Error('Failed to get access logs');
    }
  }

  /**
   * Get active sharing secrets for a tender
   */
  static async getTenderSharingSecrets(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tender_sharing_secrets')
        .select('*')
        .eq('tender_id', tenderId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tender sharing secrets:', error);
      throw new Error('Failed to get sharing secrets');
    }
  }

  /**
   * Revoke a sharing secret
   */
  static async revokeSecret(secretId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_sharing_secrets')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString()
        })
        .eq('id', secretId);

      if (error) throw error;
    } catch (error) {
      console.error('Error revoking secret:', error);
      throw new Error('Failed to revoke sharing secret');
    }
  }

  /**
   * Update access count for a secret
   */
  static async incrementAccessCount(secretId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_secret_access', {
        secret_id: secretId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing access count:', error);
      throw new Error('Failed to update access count');
    }
  }

  /**
   * Get sharing statistics for a tender
   */
  static async getSharingStats(tenderId: string): Promise<{
    totalSecrets: number;
    activeSecrets: number;
    totalAccess: number;
    uniqueSuppliers: number;
  }> {
    try {
      const { data: secrets, error: secretsError } = await supabase
        .from('tender_sharing_secrets')
        .select('supplier_email, access_count, is_active')
        .eq('tender_id', tenderId);

      if (secretsError) throw secretsError;

      const { data: logs, error: logsError } = await supabase
        .from('tender_access_logs')
        .select('supplier_email')
        .eq('tender_id', tenderId);

      if (logsError) throw logsError;

      const stats = {
        totalSecrets: secrets?.length || 0,
        activeSecrets: secrets?.filter(s => s.is_active).length || 0,
        totalAccess: secrets?.reduce((sum, s) => sum + (s.access_count || 0), 0) || 0,
        uniqueSuppliers: new Set([
          ...(secrets?.map(s => s.supplier_email) || []),
          ...(logs?.map(l => l.supplier_email) || [])
        ]).size
      };

      return stats;
    } catch (error) {
      console.error('Error getting sharing stats:', error);
      throw new Error('Failed to get sharing statistics');
    }
  }
}
