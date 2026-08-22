// src/infrastructure/adapters/email/SendGridAdapter.ts
/**
 * SendGridAdapter – Adaptateur SendGrid
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from '@/application/services/email/EmailProvider';
import { getAppConfig } from '@/config/app';

const getEnv = (key: string): string | undefined => {
  if (typeof Deno !== 'undefined' && Deno.env) {
    return Deno.env.get(key);
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  return undefined;
};

export class SendGridAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    const config = getAppConfig();
    this.apiKey = getEnv('SENDGRID_API_KEY') || '';
    this.defaultFrom = config.email?.from || getEnv('SENDGRID_FROM') || 'noreply@hadratech.com';
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error('SendGrid API key is not configured.');
    }

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
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${text}`);
    }

    return { success: true, messageId: 'sg-' + Date.now() };
  }
}