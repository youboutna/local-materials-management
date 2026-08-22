// src/application/services/email/EmailService.ts
/**
 * EmailService – Service applicatif (orchestration)
 * Dépend de l’abstraction EmailProvider (injection)
 * Application Layer – Hexagonal Architecture
 */

import { EmailOptions, EmailProvider } from './EmailProvider';

export class EmailService {
  constructor(private provider: EmailProvider) {}

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    return this.provider.send(options);
  }
}