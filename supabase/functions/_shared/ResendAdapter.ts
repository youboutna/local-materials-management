// src/infrastructure/email/ResendAdapter.ts
/**
 * ResendAdapter – Adaptateur Resend
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from './EmailProvider.ts';

export class ResendAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    const env = typeof Deno !== 'undefined' ? Deno.env : process.env;
    this.apiKey = env.get('RESEND_API_KEY') || '';
    this.defaultFrom = env.get('RESEND_FROM') || 'onboarding@resend.dev';
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) throw new Error('Resend API key missing');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html || options.text || '',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Resend API error');
    return { success: true, messageId: data.id };
  }
}