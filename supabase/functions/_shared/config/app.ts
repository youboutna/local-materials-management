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
  const raw = (env('EMAIL_PROVIDER') || 'resend').toLowerCase();
  if (raw === 'smtp' || raw === 'sendgrid' || raw === 'resend') return raw;
  return 'resend';
}

export function getEmailFrom(): string {
  return (
    env('RESEND_FROM') ||
    env('SENDGRID_FROM') ||
    env('SMTP_FROM') ||
    'onboarding@resend.dev'
  );
}

export function getEnv(key: string): string | undefined {
  return env(key);
}
