// src/application/services/email/index.ts
export type { EmailOptions, EmailProvider } from './EmailProvider';
export { EmailService } from './EmailService';
// L'envoi réel est délégué à l'Edge Function `send-email-notification`
// (aucun provider email n'est instancié côté navigateur).

