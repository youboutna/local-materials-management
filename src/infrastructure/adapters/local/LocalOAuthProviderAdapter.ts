/**
 * LocalOAuthProviderAdapter
 * Simulates OAuth flows for Google/GitHub/Microsoft in DEV_MODE.
 * Uses DEV_USERS as the authoritative identity source — no network calls.
 */
import { DEV_USERS } from '@/config/constants';

export type OAuthProviderId = 'google' | 'github' | 'microsoft';

export interface IOAuthProviderRepository {
  signInWithProvider(
    provider: OAuthProviderId
  ): Promise<{ url?: string; user?: any; error: Error | null }>;
  linkProvider(provider: OAuthProviderId, userId: string): Promise<{ error: Error | null }>;
  unlinkProvider(provider: OAuthProviderId, userId: string): Promise<{ error: Error | null }>;
  listLinkedProviders(userId: string): Promise<{ providers: OAuthProviderId[]; error: Error | null }>;
}

const LINKS_KEY = 'dev_oauth_links';

function loadLinks(): Record<string, OAuthProviderId[]> {
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY) ?? '{}');
  } catch {
    return {};
  }
}
function saveLinks(v: Record<string, OAuthProviderId[]>) {
  try {
    localStorage.setItem(LINKS_KEY, JSON.stringify(v));
  } catch {}
}

export class LocalOAuthProviderAdapter implements IOAuthProviderRepository {
  async signInWithProvider(provider: OAuthProviderId) {
    // Return the first DEV user as if OAuth had succeeded.
    const first = Object.values(DEV_USERS ?? {})[0];
    if (!first) return { error: new Error('No DEV_USERS available') };
    console.info(`[LocalOAuthProviderAdapter] simulated ${provider} sign-in`, first);
    return { user: first, error: null };
  }

  async linkProvider(provider: OAuthProviderId, userId: string) {
    const links = loadLinks();
    links[userId] = Array.from(new Set([...(links[userId] ?? []), provider]));
    saveLinks(links);
    return { error: null };
  }

  async unlinkProvider(provider: OAuthProviderId, userId: string) {
    const links = loadLinks();
    links[userId] = (links[userId] ?? []).filter((p) => p !== provider);
    saveLinks(links);
    return { error: null };
  }

  async listLinkedProviders(userId: string) {
    return { providers: loadLinks()[userId] ?? [], error: null };
  }
}
