/**
 * Garde d'architecture : écrans, hooks, services, domaine et DTO n'importent
 * l'infrastructure qu'au travers de RepositoryFactory (fournisseurs interchangeables).
 */
import { describe, expect, it } from 'vitest';

const files = import.meta.glob(
  [
    '/src/{components,pages,hooks,application,domain,contexts,dtos}/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const FORBIDDEN = /(?:from\s*|import\(\s*)['"]@\/(?:infrastructure\/(?!RepositoryFactory['"])|integrations\/)/;

describe('no direct infrastructure dependency outside RepositoryFactory', () => {
  it('scans source files', () => {
    expect(Object.keys(files).length).toBeGreaterThan(100);
  });

  it('has zero direct imports of adapters or provider clients', () => {
    const offenders = Object.entries(files)
      .filter(([, src]) => FORBIDDEN.test(src))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
