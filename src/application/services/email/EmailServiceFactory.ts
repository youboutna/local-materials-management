// src/application/services/email/EmailServiceFactory.ts
/**
 * EmailServiceFactory – Composition root
 * Instancie le bon adaptateur selon EMAIL_PROVIDER et construit le service
 * Utilise getAppConfig() pour la configuration centralisée
 */

import { ResendAdapter } from '@/infrastructure/adapters/email/ResendAdapter';
import { SendGridAdapter } from '@/infrastructure/adapters/email/SendGridAdapter';
import { SmtpAdapter } from '@/infrastructure/adapters/email/SmtpAdapter';
import { EmailProvider } from './EmailProvider';
import { EmailService } from './EmailService';
import { getEmailProvider } from '@/config/app';

export function createEmailService(): EmailService {
  const providerName = getEmailProvider();
  console.log('[EmailServiceFactory] Using EMAIL_PROVIDER:', providerName);

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
      console.warn(`[EmailServiceFactory] Unsupported provider "${providerName}", falling back to Resend`);
      provider = new ResendAdapter();
  }

  return new EmailService(provider);
}