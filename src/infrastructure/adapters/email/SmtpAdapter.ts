// src/infrastructure/email/SmtpAdapter.ts
/**
 * SmtpAdapter – Adaptateur SMTP (Office 365, Gmail, etc.)
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from '@/application/services/email/EmailProvider';

export class SmtpAdapter implements EmailProvider {
  private config: {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
  };

  constructor() {
    const env = typeof Deno !== 'undefined' ? Deno.env : process.env;
    this.config = {
      host: env.get('SMTP_HOST') || 'smtp.office365.com',
      port: parseInt(env.get('SMTP_PORT') || '587'),
      username: env.get('SMTP_USERNAME') || '',
      password: env.get('SMTP_PASSWORD') || '',
      from: env.get('SMTP_FROM') || 'noreply@hadratech.com',
    };
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const { host, port, username, password, from } = this.config;
    if (!username || !password) throw new Error('SMTP credentials not configured');

    // Pour Deno (Edge Functions) : utilise le module standard
    const { SmtpClient } = await import('https://deno.land/x/smtp@v0.7.0/mod.ts');
    const client = new SmtpClient();

    await client.connectTLS({
      hostname: host,
      port,
      username,
      password,
    });

    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const html = options.html || options.text || '';

    await client.send({
      from: options.from || from,
      to,
      subject: options.subject,
      content: options.text || '',
      html,
    });

    await client.close();

    return { success: true, messageId: 'smtp-' + Date.now() };
  }
}