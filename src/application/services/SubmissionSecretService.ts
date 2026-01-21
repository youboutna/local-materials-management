/**
 * Submission Secret Service
 * Uses in-memory storage as the table doesn't exist
 */

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

// In-memory store
const secretsStore = new Map<string, SubmissionSecret>();

export class SubmissionSecretService {
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
      is_active: true,
      access_count: 0,
      max_access: maxAccess,
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
   * Deactivate a submission secret
   */
  static async deactivateSecret(secretId: string): Promise<void> {
    const secret = secretsStore.get(secretId);
    if (secret) {
      secret.is_active = false;
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
}
