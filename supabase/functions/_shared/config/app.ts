/**
 * Edge (Deno) email configuration – no Vite / import.meta usage.
 * Single source of truth for provider selection inside Edge Functions.
 */

export type EdgeEmailProvider = 'smtp' | 'resend' | 'sendgrid';

const env = (key: string): string | undefined => {
  try {
    return Deno.env.get(key) ?? undefined;
  } catch {
    return undefined;
  }
};

export function getEmailProvider(): EdgeEmailProvider {
  const raw = (env('EMAIL_PROVIDER') || env('VITE_EMAIL_PROVIDER') || 'resend').toLowerCase();
  if (raw === 'smtp' || raw === 'sendgrid' || raw === 'resend') return raw;
  throw new Error(`Unsupported EMAIL_PROVIDER: ${raw}`);
}

export function getEmailFrom(): string {
  const provider = getEmailProvider();
  const key = provider === 'resend' ? 'RESEND_FROM' : provider === 'sendgrid' ? 'SENDGRID_FROM' : 'SMTP_FROM';
  return (
    env(key) ||
    env('Deno_mail_from_notif') ||
    env('Deno_mail_from_name') ||
    ''
  );
}

export function getEnv(key: string): string | undefined {
  return env(key);
}
