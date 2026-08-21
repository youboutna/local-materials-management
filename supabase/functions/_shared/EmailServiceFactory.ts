// src/application/services/email/EmailServiceFactory.ts
/**
 * EmailServiceFactory – Composition root
 * Instancie le bon adaptateur selon EMAIL_PROVIDER et construit le service
 * Application Layer – Point d’entrée pour l’injection
 */

import { ResendAdapter } from './ResendAdapter.ts';
import { SendGridAdapter } from './SendGridAdapter.ts';
import { SmtpAdapter } from './SmtpAdapter.ts';
import { EmailProvider } from './EmailProvider.ts';
import { EmailService } from './EmailService.ts';

export function createEmailService(): EmailService {
  const providerName = (process.env.EMAIL_PROVIDER || Deno.env.get('EMAIL_PROVIDER') || 'smtp').toLowerCase();
  let provider: EmailProvider;

  switch (providerName) {
    case 'smtp':
      provider = new SmtpAdapter();
      break;
    case 'resend':
      provider = new ResendAdapter();
      break;
    case 'sendgrid':
      provider = new SendGridAdapter();
      break;
    default:
      throw new Error(`Unsupported email provider: ${providerName}`);
  }

  return new EmailService(provider);
}