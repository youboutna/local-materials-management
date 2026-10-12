// src/infrastructure/adapters/email/SendGridAdapter.ts
/**
 * SendGridAdapter – Adaptateur SendGrid
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from './EmailProvider.ts';
import { getEmailFrom, getEnv } from './config/app.ts';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
};

export class SendGridAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = getEnv('SENDGRID_API_KEY') || '';
    this.defaultFrom = getEmailFrom();
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error('SendGrid API key is not configured.');
    }
    if (!options.from && !this.defaultFrom) throw new Error('SendGrid sender address is not configured.');

    const to = Array.isArray(options.to) ? options.to.map((email) => ({ email })) : [{ email: options.to }];
    const from = options.from || this.defaultFrom;
    const html = options.html || options.text || '';

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to }],
        from: { email: from },
        subject: options.subject,
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          { type: 'text/html', value: html },
        ],
        ...(options.replyTo ? { reply_to: { email: options.replyTo } } : {}),
        ...(options.attachments?.length ? {
          attachments: options.attachments.map((attachment) => ({
            content: typeof attachment.content === 'string'
              ? attachment.content
              : toBase64(attachment.content),
            filename: attachment.filename,
            type: attachment.contentType,
            disposition: 'attachment',
          })),
        } : {}),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${text}`);
    }

    return { success: true, messageId: 'sg-' + Date.now() };
  }
}