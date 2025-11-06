// Service for secure tender submission secret management
// Implements separation of concerns and loose coupling with Supabase
// ACID principles for submission access control

import { supabase } from '@/integrations/supabase/client';
import { 
  SubmissionSecretDTO,
  CreateSubmissionSecretDTO,
  CreateSubmissionAccessLogDTO,
  ValidateSubmissionSecretResponseDTO,
  SubmissionAccessLogDTO
} from '@/types/submission-dto';

/**
 * Service for managing secure tender submission access
 * Decoupled from UI components, focuses on business logic
 */
export class SubmissionSecretService {
  /**
   * Generate a unique secret code for submission access
   * Uses Supabase function for ACID compliance
   */
  static async generateSecretCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_submission_secret_code');
    
    if (error) {
      console.error('Error generating submission secret code:', error);
      throw new Error('Impossible de générer le code secret');
    }
    
    return data;
  }

  /**
   * Create or update secret code for a submission
   * ACID compliant transaction
   */
  static async createSubmissionSecret(
    dto: CreateSubmissionSecretDTO
  ): Promise<SubmissionSecretDTO> {
    const secretCode = await this.generateSecretCode();
    
    const updateData: any = {
      secret_code: secretCode,
      secret_created_at: new Date().toISOString(),
      secret_access_count: 0,
      is_secret_active: true
    };

    if (dto.expires_at) {
      updateData.secret_expires_at = dto.expires_at;
    }
    
    if (dto.max_access) {
      updateData.max_secret_access = dto.max_access;
    }

    if (dto.evaluation_phase) {
      updateData.evaluation_phase = dto.evaluation_phase;
    }

    if (dto.evaluation_stage) {
      updateData.evaluation_stage = dto.evaluation_stage;
    }

    const { data, error } = await supabase
      .from('tender_submissions')
      .update(updateData)
      .eq('id', dto.submission_id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error creating submission secret:', error);
      throw new Error('Impossible de créer le code secret');
    }

    if (!data) {
      throw new Error('Soumission introuvable');
    }
    
    return data as SubmissionSecretDTO;
  }

  /**
   * Validate a secret code and get submission access
   * Uses Supabase function with ACID guarantees
   */
  static async validateSecret(
    secretCode: string
  ): Promise<ValidateSubmissionSecretResponseDTO> {
    const { data, error } = await supabase.rpc('validate_submission_secret', {
      secret_code_param: secretCode
    });
    
    if (error) {
      console.error('Error validating submission secret:', error);
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
      submission_id: result.submission_id,
      tender_id: result.tender_id,
      supplier_name: result.supplier_name,
      message: result.message
    };
  }

  /**
   * Get submission details by submission ID
   */
  static async getSubmissionById(
    submissionId: string
  ): Promise<SubmissionSecretDTO | null> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('id', submissionId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching submission by ID:', error);
      return null;
    }
    
    return data as SubmissionSecretDTO;
  }

  /**
   * Get submission by secret code
   */
  static async getSubmissionBySecret(
    secretCode: string
  ): Promise<SubmissionSecretDTO | null> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('secret_code', secretCode)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching submission by secret:', error);
      return null;
    }
    
    return data as SubmissionSecretDTO;
  }

  /**
   * Deactivate a submission secret
   */
  static async deactivateSecret(submissionId: string): Promise<void> {
    const { error } = await supabase
      .from('tender_submissions')
      .update({ is_secret_active: false })
      .eq('id', submissionId);
    
    if (error) {
      console.error('Error deactivating submission secret:', error);
      throw new Error('Impossible de désactiver le code secret');
    }
  }

  /**
   * Regenerate secret code for a submission
   */
  static async regenerateSecret(submissionId: string): Promise<SubmissionSecretDTO> {
    const secretCode = await this.generateSecretCode();
    
    const { data, error } = await supabase
      .from('tender_submissions')
      .update({ 
        secret_code: secretCode,
        secret_created_at: new Date().toISOString(),
        secret_access_count: 0,
        is_secret_active: true
      })
      .eq('id', submissionId)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error regenerating submission secret:', error);
      throw new Error('Impossible de régénérer le code secret');
    }

    if (!data) {
      throw new Error('Soumission introuvable');
    }
    
    return data as SubmissionSecretDTO;
  }

  /**
   * Log access to a submission
   * For audit trail and compliance
   */
  static async logAccess(dto: CreateSubmissionAccessLogDTO): Promise<void> {
    // Validate that submission_id is a valid UUID before inserting
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!dto.submission_id || !uuidRegex.test(dto.submission_id)) {
      console.error('Invalid submission_id for logging:', dto.submission_id);
      // Don't throw error, just log and return
      return;
    }

    const { error } = await supabase
      .from('submission_access_logs')
      .insert({
        submission_id: dto.submission_id,
        action_type: dto.action_type,
        accessed_sections: dto.accessed_sections,
        ip_address: dto.ip_address,
        user_agent: dto.user_agent,
        metadata: dto.metadata || {}
      });
    
    if (error) {
      console.error('Error logging submission access:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get access logs for a submission
   */
  static async getAccessLogs(submissionId: string): Promise<SubmissionAccessLogDTO[]> {
    const { data, error } = await supabase
      .from('submission_access_logs')
      .select('*')
      .eq('submission_id', submissionId)
      .order('accessed_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching access logs:', error);
      throw new Error('Impossible de récupérer les logs d\'accès');
    }
    
    return data as SubmissionAccessLogDTO[];
  }

  /**
   * Calculate default expiration date
   */
  static getDefaultExpirationDate(days: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Check if secret is still valid (client-side check)
   */
  static isSecretValid(submission: SubmissionSecretDTO): {
    valid: boolean;
    reason?: string;
  } {
    if (!submission.is_secret_active) {
      return { valid: false, reason: 'Code désactivé' };
    }

    if (submission.secret_expires_at) {
      const expiryDate = new Date(submission.secret_expires_at);
      if (expiryDate < new Date()) {
        return { valid: false, reason: 'Code expiré' };
      }
    }

    if (submission.max_secret_access && 
        submission.secret_access_count >= submission.max_secret_access) {
      return { valid: false, reason: 'Limite d\'accès atteinte' };
    }

    return { valid: true };
  }
}
