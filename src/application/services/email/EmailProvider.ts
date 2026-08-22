// src/application/services/email/EmailProvider.ts
/**
 * EmailProvider – Port (Interface) pour l’envoi d’emails
 * Application Layer – Hexagonal Architecture
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string | Uint8Array; contentType?: string }>;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }>;
}