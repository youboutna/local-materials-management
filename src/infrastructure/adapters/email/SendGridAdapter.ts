// src/infrastructure/email/SendGridAdapter.ts
/**
 * SendGridAdapter – Adaptateur SendGrid
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from '@/application/services/email/EmailProvider';

export class SendGridAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    const env = typeof Deno !== 'undefined' ? Deno.env : process.env;
    this.apiKey = env.get('SENDGRID_API_KEY') || '';
    this.defaultFrom = env.get('SENDGRID_FROM') || 'noreply@hadratech.com';
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) throw new Error('SendGrid API key missing');

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(options.to)
              ? options.to.map((email) => ({ email }))
              : [{ email: options.to }],
          },
        ],
        from: { email: options.from || this.defaultFrom },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html || options.text || '' }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${text}`);
    }
    return { success: true, messageId: 'sg-' + Date.now() };
  }
}