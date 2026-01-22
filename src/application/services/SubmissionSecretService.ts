/**
 * Submission Secret Service
 * Uses in-memory storage as the table doesn't exist
 */

export interface SubmissionSecret {
  id: string;
  submission_id: string;
  secret_code: string;
  secret_expires_at?: string; // Match component expectation
  expires_at: string; // Internal use
  is_secret_active: boolean; // Match component expectation
  is_active: boolean; // Internal use
  secret_access_count: number; // Match component expectation
  access_count: number; // Internal use
  max_secret_access: number; // Match component expectation
  max_access: number; // Internal use
  secret_created_at?: string; // Match component expectation
  created_at: string;
  updated_at: string;
}

// In-memory store
const secretsStore = new Map<string, SubmissionSecret>();

export class SubmissionSecretService {
  static validateSecret(secretCode: string) {
    throw new Error("Method not implemented.");
  }
  /**
   * Generate a secret code for a submission
   */
  static async generateSubmissionSecret(
    submissionId: string,
    maxAccess: number = 5,
    expiresAt?: string
  ): Promise<SubmissionSecret> {
    const secretCode = this.generateRandomCode(6);
    const expirationDate = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const secret: SubmissionSecret = {
      id: crypto.randomUUID(),
      submission_id: submissionId,
      secret_code: secretCode,
      expires_at: expirationDate,
      secret_expires_at: expirationDate, // Match component expectation
      is_active: true,
      is_secret_active: true, // Match component expectation
      access_count: 0,
      secret_access_count: 0, // Match component expectation
      max_access: maxAccess,
      max_secret_access: maxAccess, // Match component expectation
      secret_created_at: now, // Match component expectation
      created_at: now,
      updated_at: now
    };

    secretsStore.set(secret.id, secret);
    return secret;
  }

  /**
   * Validate and retrieve a submission by secret code
   */
  static async validateSubmissionSecret(secretCode: string): Promise<SubmissionSecret | null> {
    let foundSecret: SubmissionSecret | undefined = undefined;
    
    secretsStore.forEach(secret => {
      if (secret.secret_code === secretCode && secret.is_active) {
        foundSecret = secret;
      }
    });

    if (!foundSecret) return null;

    const secret = foundSecret as SubmissionSecret;

    // Check if secret has expired
    if (new Date(secret.expires_at) < new Date()) {
      await this.deactivateSecret(secret.id);
      return null;
    }

    // Check if max access has been reached
    if (secret.access_count >= secret.max_access) {
      await this.deactivateSecret(secret.id);
      return null;
    }

    // Increment access count
    await this.incrementAccessCount(secret.id);

    return secretsStore.get(secret.id) || null;
  }

  /**
   * Get submission secrets for a submission
   */
  static async getSubmissionSecrets(submissionId: string): Promise<SubmissionSecret[]> {
    const results: SubmissionSecret[] = [];
    secretsStore.forEach(secret => {
      if (secret.submission_id === submissionId) {
        results.push(secret);
      }
    });
    return results.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get submission by ID (returns the latest secret for the submission)
   */
  static async getSubmissionById(submissionId: string): Promise<SubmissionSecret | null> {
    const secrets = await this.getSubmissionSecrets(submissionId);
    return secrets.length > 0 ? secrets[0] : null;
  }

  /**
   * Deactivate a submission secret
   */
  static async deactivateSecret(secretId: string): Promise<void> {
    const secret = secretsStore.get(secretId);
    if (secret) {
      secret.is_active = false;
      secret.is_secret_active = false; // Keep in sync
      secret.updated_at = new Date().toISOString();
      secretsStore.set(secretId, secret);
    }
  }

  /**
   * Delete a submission secret
   */
  static async deleteSubmissionSecret(secretId: string): Promise<void> {
    secretsStore.delete(secretId);
  }

  /**
   * Increment the access count for a secret
   */
  private static async incrementAccessCount(secretId: string): Promise<void> {
    const secret = secretsStore.get(secretId);
    if (secret) {
      secret.access_count += 1;
      secret.secret_access_count = secret.access_count; // Keep in sync
      secret.updated_at = new Date().toISOString();
      secretsStore.set(secretId, secret);
    }
  }

  /**
   * Generate a random alphanumeric code
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
   */
  static async cleanupExpiredSecrets(): Promise<number> {
    let cleanedCount = 0;
    const now = new Date();
    
    secretsStore.forEach((secret, id) => {
      if (secret.is_active && new Date(secret.expires_at) < now) {
        secretsStore.delete(id);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  /**
   * Get active secrets count for a submission
   */
  static async getActiveSecretsCount(submissionId: string): Promise<number> {
    const now = new Date();
    let count = 0;
    
    secretsStore.forEach(secret => {
      if (
        secret.submission_id === submissionId &&
        secret.is_active &&
        new Date(secret.expires_at) > now
      ) {
        count++;
      }
    });

    return count;
  }

  /**
   * Regenerate secret for a submission
   */
  static async regenerateSecret(submissionId: string): Promise<SubmissionSecret> {
    // Deactivate existing secrets for this submission
    const existingSecrets = await this.getSubmissionSecrets(submissionId);
    for (const secret of existingSecrets) {
      await this.deactivateSecret(secret.id);
    }

    // Generate new secret
    return await this.generateSubmissionSecret(submissionId);
  }

  /**
   * Check if secret is still valid (client-side check)
   */
  static isSecretValid(submission: SubmissionSecret): {
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
