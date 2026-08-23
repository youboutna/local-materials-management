/**
 * ResendAdapter (Edge / Deno) – appel serveur à l'API Resend.
 * Aucun appel navigateur : évite les blocages CORS côté client.
 */

import { EmailOptions, EmailProvider } from './EmailProvider.ts';
import { getEmailFrom, getEnv } from './config/app.ts';

export class ResendAdapter implements EmailProvider {
  private apiKey: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = getEnv('RESEND_API_KEY') || '';
    this.defaultFrom = getEmailFrom();

    if (!this.apiKey) {
      console.warn('[ResendAdapter] RESEND_API_KEY is not set. Email sending will fail.');
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY is not configured in Edge Function secrets.');
    }

    const to = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || this.defaultFrom;
    const html = options.html || options.text || '';

    const attachments = (options.attachments ?? []).map((a) => ({
      filename: a.filename,
      content: typeof a.content === 'string' ? a.content : btoa(String.fromCharCode(...a.content)),
      content_type: a.contentType,
    }));

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
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
        ...(attachments.length ? { attachments } : {}),
      }),
    });


    const body = await response.text();

    if (!response.ok) {
      console.error(`[ResendAdapter] Resend API error [${response.status}]: ${body}`);
      throw new Error(`Resend API error [${response.status}]: ${body}`);
    }

    let messageId: string | undefined;
    try {
      messageId = JSON.parse(body)?.id;
    } catch {
      messageId = undefined;
    }

    console.log('[ResendAdapter] Email sent', { messageId, to, subject: options.subject });
    return { success: true, messageId };
  }
}
