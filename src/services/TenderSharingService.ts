// Service for secure tender document sharing with ACID principles
import { supabase } from '@/integrations/supabase/client';
import { 
  TenderSharingSecretDTO, 
  CreateSharingSecretDTO, 
  CreateAccessLogDTO, 
  ValidateSecretResponseDTO 
} from '@/dtos/entities/tender-sharing-dto';

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
    
    if (error) {
      console.error('Error creating sharing secret:', error);
      throw new Error('Failed to create sharing secret');
    }
    
    return data as TenderSharingSecretDTO;
  }

  /**
   * Validate a secret code and get access information
   */
  static async validateSecret(
    secretCode: string
  ): Promise<ValidateSecretResponseDTO> {
    const { data, error } = await supabase.rpc('validate_tender_secret', {
      secret_code_param: secretCode
    });
    
    if (error) {
      console.error('Error validating secret:', error);
      return {
        is_valid: false,
        message: 'Erreur de validation'
      };
    }
    
    if (!data || data.length === 0) {
      return {
        is_valid: false,
        message: 'Code invalide'
      };
    }
    
    const result = data[0];
    return {
      is_valid: result.is_valid,
      tender_id: result.tender_id,
      allowed_documents: result.allowed_documents,
      message: result.message
    };
  }

  /**
   * Get sharing secrets for a tender
   */
  static async getSecretsForTender(
    tenderId: string
  ): Promise<TenderSharingSecretDTO[]> {
    const { data, error } = await supabase
      .from('tender_sharing_secrets')
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching secrets:', error);
      throw new Error('Failed to fetch sharing secrets');
    }
    
    return data as TenderSharingSecretDTO[];
  }

  /**
   * Deactivate a sharing secret
   */
  static async deactivateSecret(secretId: string): Promise<void> {
    const { error } = await supabase
      .from('tender_sharing_secrets')
      .update({ is_active: false })
      .eq('id', secretId);
    
    if (error) {
      console.error('Error deactivating secret:', error);
      throw new Error('Failed to deactivate secret');
    }
  }

  /**
   * Log access to shared documents
   */
  static async logAccess(dto: CreateAccessLogDTO): Promise<void> {
    const { error } = await supabase
      .from('tender_sharing_access_logs')
      .insert({
        sharing_secret_id: dto.sharing_secret_id,
        ip_address: dto.ip_address,
        user_agent: dto.user_agent,
        accessed_documents: dto.accessed_documents,
        action_type: dto.action_type,
        metadata: dto.metadata || {}
      });
    
    if (error) {
      console.error('Error logging access:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get access logs for a secret
   */
  static async getAccessLogs(secretId: string) {
    const { data, error } = await supabase
      .from('tender_sharing_access_logs')
      .select('*')
      .eq('sharing_secret_id', secretId)
      .order('accessed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching access logs:', error);
      throw new Error('Failed to fetch access logs');
    }
    
    return data;
  }

  /**
   * Calculate expiration date (default 7 days from now)
   */
  static getDefaultExpirationDate(days: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}
