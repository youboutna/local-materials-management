import { supabase } from '@/integrations/supabase/client';

export interface SubmissionSecret {
  id: string;
  submission_id: string;
  secret_code: string;
  expires_at: string;
  is_active: boolean;
  access_count: number;
  max_access: number;
  created_at: string;
  updated_at: string;
}

export class SubmissionSecretService {
  /**
   * Generate a secret code for a submission
   * @param submissionId The submission ID
   * @param maxAccess Maximum number of accesses allowed
   * @param expiresAt Expiration date (optional, defaults to 24 hours)
   * @returns The generated submission secret
   */
  static async generateSubmissionSecret(
    submissionId: string,
    maxAccess: number = 5,
    expiresAt?: string
  ): Promise<SubmissionSecret> {
    // Generate a random 6-character alphanumeric code
    const secretCode = this.generateRandomCode(6);
    
    // Set expiration date (default to 24 hours from now)
    const expirationDate = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('submission_secrets')
      .insert({
        submission_id: submissionId,
        secret_code: secretCode,
        expires_at: expirationDate,
        is_active: true,
        access_count: 0,
        max_access: maxAccess
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating submission secret:', error);
      throw new Error(`Failed to generate submission secret: ${error.message}`);
    }

    return data;
  }

  /**
   * Validate and retrieve a submission by secret code
   * @param secretCode The secret code to validate
   * @returns The submission data if valid, null otherwise
   */
  static async validateSubmissionSecret(secretCode: string): Promise<SubmissionSecret | null> {
    const { data, error } = await supabase
      .from('submission_secrets')
      .select('*')
      .eq('secret_code', secretCode)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Secret not found
      }
      console.error('Error validating submission secret:', error);
      throw new Error(`Failed to validate submission secret: ${error.message}`);
    }

    // Check if secret has expired
    if (new Date(data.expires_at) < new Date()) {
      await this.deactivateSecret(data.id);
      return null;
    }

    // Check if max access has been reached
    if (data.access_count >= data.max_access) {
      await this.deactivateSecret(data.id);
      return null;
    }

    // Increment access count
    await this.incrementAccessCount(data.id);

    return data;
  }

  /**
   * Get submission secrets for a submission
   * @param submissionId The submission ID
   * @returns Array of submission secrets
   */
  static async getSubmissionSecrets(submissionId: string): Promise<SubmissionSecret[]> {
    const { data, error } = await supabase
      .from('submission_secrets')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submission secrets:', error);
      throw new Error(`Failed to fetch submission secrets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Deactivate a submission secret
   * @param secretId The secret ID
   */
  static async deactivateSecret(secretId: string): Promise<void> {
    const { error } = await supabase
      .from('submission_secrets')
      .update({ is_active: false })
      .eq('id', secretId);

    if (error) {
      console.error('Error deactivating submission secret:', error);
      throw new Error(`Failed to deactivate submission secret: ${error.message}`);
    }
  }

  /**
   * Delete a submission secret
   * @param secretId The secret ID
   */
  static async deleteSubmissionSecret(secretId: string): Promise<void> {
    const { error } = await supabase
      .from('submission_secrets')
      .delete()
      .eq('id', secretId);

    if (error) {
      console.error('Error deleting submission secret:', error);
      throw new Error(`Failed to delete submission secret: ${error.message}`);
    }
  }

  /**
   * Increment the access count for a secret
   * @param secretId The secret ID
   */
  private static async incrementAccessCount(secretId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_secret_access_count', {
      secret_id: secretId
    });

    if (error) {
      console.error('Error incrementing access count:', error);
      throw new Error(`Failed to increment access count: ${error.message}`);
    }
  }

  /**
   * Generate a random alphanumeric code
   * @param length The length of the code
   * @returns The generated code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up expired secrets
   * @returns Number of cleaned up secrets
   */
  static async cleanupExpiredSecrets(): Promise<number> {
    const { data, error } = await supabase
      .from('submission_secrets')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) {
      console.error('Error cleaning up expired secrets:', error);
      throw new Error(`Failed to clean up expired secrets: ${error.message}`);
    }

    return (data || []).length;
  }

  /**
   * Get active secrets count for a submission
   * @param submissionId The submission ID
   * @returns Number of active secrets
   */
  static async getActiveSecretsCount(submissionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('submission_secrets')
      .select('*', { count: 'exact' })
      .eq('submission_id', submissionId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error counting active secrets:', error);
      throw new Error(`Failed to count active secrets: ${error.message}`);
    }

    return count || 0;
  }
}
