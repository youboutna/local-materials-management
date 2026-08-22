// src/infrastructure/adapters/email/ResendAdapter.ts
/**
 * ResendAdapter – Adaptateur Resend
 * Infrastructure Layer – Implémentation concrète
 * Compatible Node.js, Deno, et Navigateur (Vite)
 */

import { EmailOptions, EmailProvider } from './EmailProvider.ts';
import { getEmailProvider } from './config/app.ts';

const getEnv = (key: string): string | undefined => {
  // Environnement Deno (Edge Functions)
  if (typeof Deno !== 'undefined' && Deno.env) {
    return Deno.env.get(key);
  }
  // Environnement Node.js
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Environnement Navigateur (Vite) – les variables doivent être préfixées par VITE_
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  return undefined;
};

export class ResendAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    const config = getAppConfig();
    this.apiKey = getEnv('RESEND_API_KEY') || '';
    this.defaultFrom = config.email?.from || getEnv('RESEND_FROM') || 'onboarding@resend.dev';

    if (!this.apiKey) {
      console.warn('[ResendAdapter] RESEND_API_KEY is not set. Email sending will fail.');
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error('Resend API key is not configured. Please set RESEND_API_KEY in your environment.');
    }

    const to = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || this.defaultFrom;
    const html = options.html || options.text || '';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject: options.subject,
          html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[ResendAdapter] API error:', data);
        throw new Error(data.message || `Resend API error: ${response.status}`);
      }

      console.log('[ResendAdapter] Email sent successfully:', {
        messageId: data.id,
        to,
        subject: options.subject,
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('[ResendAdapter] Failed to send email:', error);
      throw error;
    }
  }
}