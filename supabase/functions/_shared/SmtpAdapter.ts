// src/infrastructure/adapters/email/SmtpAdapter.ts
/**
 * SmtpAdapter – Adaptateur SMTP
 * Infrastructure Layer – Implémentation concrète
 */

import { EmailOptions, EmailProvider } from './EmailProvider.ts';
import { getEmailProvider } from './config/app.ts';

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

export class SmtpAdapter implements EmailProvider {
  private config: {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
  };

  constructor() {
    const config = getAppConfig();
    this.config = {
      host: getEnv('SMTP_HOST') || 'smtp.office365.com',
      port: parseInt(getEnv('SMTP_PORT') || '587'),
      username: getEnv('SMTP_USERNAME') || '',
      password: getEnv('SMTP_PASSWORD') || '',
      from: config.email?.from || getEnv('SMTP_FROM') || 'noreply@hadratech.com',
    };
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const { host, port, username, password, from } = this.config;
    if (!username || !password) {
      throw new Error('SMTP credentials not configured');
    }

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