// Configuration Adapter - Architecture Hexagonale
// Implements configuration management for different deployment scenarios

import { 
  DatabaseConfig, 
  AuthConfig, 
  StorageConfig, 
  APIConfig,
  DeploymentConfig 
} from '@/application/services/ConfigurationService';

export interface IConfigurationAdapter {
  // Database operations
  getDatabaseConfig(): DatabaseConfig;
  setDatabaseConfig(config: DatabaseConfig): void;
  
  // Auth operations
  getAuthConfig(): AuthConfig;
  setAuthConfig(config: AuthConfig): void;
  
  // Storage operations
  getStorageConfig(): StorageConfig;
  setStorageConfig(config: StorageConfig): void;
  
  // API operations
  getAPIConfig(): APIConfig;
  setAPIConfig(config: APIConfig): void;
  
  // Full configuration
  getDeploymentConfig(): DeploymentConfig;
  setDeploymentConfig(config: DeploymentConfig): void;
  
  // Validation
  validateConfiguration(config: DeploymentConfig): { valid: boolean; errors: string[] };
  
  // Environment variables
  generateEnvironmentVariables(config: DeploymentConfig): string;
}

export class ConfigurationAdapter implements IConfigurationAdapter {
  private config: DeploymentConfig | null = null;

  constructor(config?: DeploymentConfig) {
    if (config) {
      this.config = config;
    }
  }

  // ============= Database Configuration =============
  getDatabaseConfig(): DatabaseConfig {
    if (!this.config) {
      throw new Error('No configuration set. Call setDeploymentConfig() first.');
    }
    return this.config.database;
  }

  setDatabaseConfig(config: DatabaseConfig): void {
    if (!this.config) {
      throw new Error('No deployment configuration set. Call setDeploymentConfig() first.');
    }
    this.config.database = config;
  }

  // ============= Auth Configuration =============
  getAuthConfig(): AuthConfig {
    if (!this.config) {
      throw new Error('No configuration set. Call setDeploymentConfig() first.');
    }
    return this.config.auth;
  }

  setAuthConfig(config: AuthConfig): void {
    if (!this.config) {
      throw new Error('No deployment configuration set. Call setDeploymentConfig() first.');
    }
    this.config.auth = config;
  }

  // ============= Storage Configuration =============
  getStorageConfig(): StorageConfig {
    if (!this.config) {
      throw new Error('No configuration set. Call setDeploymentConfig() first.');
    }
    return this.config.storage;
  }

  setStorageConfig(config: StorageConfig): void {
    if (!this.config) {
      throw new Error('No deployment configuration set. Call setDeploymentConfig() first.');
    }
    this.config.storage = config;
  }

  // ============= API Configuration =============
  getAPIConfig(): APIConfig {
    if (!this.config) {
      throw new Error('No configuration set. Call setDeploymentConfig() first.');
    }
    return this.config.api;
  }

  setAPIConfig(config: APIConfig): void {
    if (!this.config) {
      throw new Error('No deployment configuration set. Call setDeploymentConfig() first.');
    }
    this.config.api = config;
  }

  // ============= Full Configuration =============
  getDeploymentConfig(): DeploymentConfig {
    if (!this.config) {
      throw new Error('No configuration set. Call setDeploymentConfig() first.');
    }
    return this.config;
  }

  setDeploymentConfig(config: DeploymentConfig): void {
    this.config = config;
  }

  // ============= Validation =============
  validateConfiguration(config: DeploymentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate database config
    if (!config.database.host) errors.push('Database host is required');
    if (!config.database.database) errors.push('Database name is required');
    if (!config.database.username) errors.push('Database username is required');
    if (!config.database.password) errors.push('Database password is required');

    // Validate auth config
    if (!config.auth.url) errors.push('Auth URL is required');
    if (!config.auth.clientId) errors.push('Auth client ID is required');
    if (!config.auth.redirectUris.length) errors.push('At least one redirect URI is required');

    // Validate storage config
    if (!config.storage.endpoint) errors.push('Storage endpoint is required');

    // Validate API config
    if (!config.api.baseUrl) errors.push('API base URL is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============= Environment Variables =============
  generateEnvironmentVariables(config: DeploymentConfig): string {
    const env = [
      `# Deployment Configuration`,
      `VITE_DEPLOYMENT_NAME=${config.name}`,
      `VITE_DEPLOYMENT_ENV=${config.environment}`,
      ``,
      `# Database Configuration`,
      `VITE_DB_PROVIDER=${config.database.provider}`,
      `VITE_DB_HOST=${config.database.host}`,
      `VITE_DB_PORT=${config.database.port}`,
      `VITE_DB_NAME=${config.database.database}`,
      `VITE_DB_USERNAME=${config.database.username}`,
      `VITE_DB_PASSWORD=${config.database.password}`,
      config.database.ssl ? `VITE_DB_SSL=true` : `VITE_DB_SSL=false`,
      ``,
      `# Authentication Configuration`,
      `VITE_AUTH_PROVIDER=${config.auth.provider}`,
      `VITE_AUTH_URL=${config.auth.url}`,
      config.auth.realm ? `VITE_AUTH_REALM=${config.auth.realm}` : '',
      `VITE_AUTH_CLIENT_ID=${config.auth.clientId}`,
      config.auth.clientSecret ? `VITE_AUTH_CLIENT_SECRET=${config.auth.clientSecret}` : '',
      `VITE_AUTH_REDIRECT_URIS=${config.auth.redirectUris.join(',')}`,
      ``,
      `# Storage Configuration`,
      `VITE_STORAGE_PROVIDER=${config.storage.provider}`,
      `VITE_STORAGE_ENDPOINT=${config.storage.endpoint}`,
      config.storage.bucket ? `VITE_STORAGE_BUCKET=${config.storage.bucket}` : '',
      config.storage.region ? `VITE_STORAGE_REGION=${config.storage.region}` : '',
      config.storage.accessKey ? `VITE_STORAGE_ACCESS_KEY=${config.storage.accessKey}` : '',
      config.storage.secretKey ? `VITE_STORAGE_SECRET_KEY=${config.storage.secretKey}` : '',
      config.storage.publicUrl ? `VITE_STORAGE_PUBLIC_URL=${config.storage.publicUrl}` : '',
      ``,
      `# API Configuration`,
      `VITE_API_URL=${config.api.baseUrl}`,
      `VITE_API_TIMEOUT=${config.api.timeout}`,
      `VITE_API_RETRIES=${config.api.retries}`,
      config.api.rateLimit ? `VITE_API_RATE_LIMIT_REQUESTS=${config.api.rateLimit.requests}` : '',
      config.api.rateLimit ? `VITE_API_RATE_LIMIT_WINDOW=${config.api.rateLimit.windowMs}` : '',
      ``,
      `# Feature Flags`,
      `VITE_FEATURE_REALTIME=${config.features.realtime}`,
      `VITE_FEATURE_EDGE_FUNCTIONS=${config.features.edgeFunctions}`,
      `VITE_FEATURE_MONITORING=${config.features.monitoring}`,
      `VITE_FEATURE_LOGGING=${config.features.logging}`,
      `VITE_FEATURE_CACHING=${config.features.caching}`
    ].filter(line => line !== '');

    return env.join('\n');
  }

  // ============= Utility Methods =============
  clone(): ConfigurationAdapter {
    if (!this.config) {
      return new ConfigurationAdapter();
    }
    
    const clonedConfig: DeploymentConfig = {
      ...this.config,
      database: { ...this.config.database },
      auth: { ...this.config.auth },
      storage: { ...this.config.storage },
      api: { ...this.config.api },
      features: { ...this.config.features }
    };
    
    return new ConfigurationAdapter(clonedConfig);
  }

  reset(): void {
    this.config = null;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}
