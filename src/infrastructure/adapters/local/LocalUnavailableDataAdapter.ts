/**
 * Fournisseur de données hors ligne générique : utilisé quand VITE_DATA_PROVIDER=local
 * pour tout port sans adaptateur local dédié. Aucune requête n'atteint la base distante :
 * lectures vides explicites, abonnements inertes, écritures refusées avec un code clair.
 */
export const LOCAL_DATA_UNAVAILABLE = 'LOCAL_DATA_UNAVAILABLE';

export class LocalDataUnavailableError extends Error {
  readonly code = LOCAL_DATA_UNAVAILABLE;
  constructor(port: string, method: string) {
    super(`${LOCAL_DATA_UNAVAILABLE}: ${port}.${method} requires the configured data provider`);
    this.name = 'LocalDataUnavailableError';
  }
}

const READ = /^(find|get|list|search|fetch|load|count|exists|has|is)/;
const COLLECTION = /(All|List|s|Many|History|Logs|Stats)$/;

export function localReadResult(method: string): unknown {
  if (/^count/.test(method)) return 0;
  if (/^(exists|has|is)/.test(method)) return false;
  if (/^(list|search)/.test(method) || COLLECTION.test(method)) return [];
  return null;
}

export function createLocalUnavailableAdapter<T>(port: string): T {
  return new Proxy({}, {
    get(_t, prop) {
      if (typeof prop !== 'string' || prop === 'then') return undefined;
      if (/^(subscribe|on|listen|channel)/.test(prop)) return () => () => undefined;
      if (/^(unsubscribe|removeChannel|dispose|clear)/.test(prop)) return () => undefined;
      if (READ.test(prop)) return async () => localReadResult(prop);
      return async () => { throw new LocalDataUnavailableError(port, prop); };
    },
  }) as T;
}
