
/**
 * Database configuration and provider selection
 */

export type DatabaseProvider = 'supabase' | 'postgresql' | 'mysql';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  url?: string;
}

// Default configuration - uses supabase
let activeDatabase: DatabaseConfig = {
  provider: 'supabase',
};

/**
 * Set the active database configuration
 */
export const setDatabaseConfig = (config: DatabaseConfig): void => {
  activeDatabase = config;
  console.log(`Database provider set to: ${config.provider}`);
};

/**
 * Get the current database configuration
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  return { ...activeDatabase };
};

/**
 * Check if the current provider is Supabase
 */
export const isSupabaseProvider = (): boolean => {
  return activeDatabase.provider === 'supabase';
};

/**
 * Check if the current provider is PostgreSQL (direct connection)
 */
export const isPostgresProvider = (): boolean => {
  return activeDatabase.provider === 'postgresql';
};

/**
 * Check if the current provider is MySQL
 */
export const isMySQLProvider = (): boolean => {
  return activeDatabase.provider === 'mysql';
};
