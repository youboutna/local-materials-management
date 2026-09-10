// Configuration Service - Architecture Hexagonale
// Centralized configuration management for adapters and deployment settings
/**
 * /src/application/services/ConfigurationService.ts
 */
export interface DatabaseConfig {
  provider: 'supabase' | 'postgresql' | 'mysql' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
}

export interface AuthConfig {
  provider: 'supabase' | 'keycloak' | 'auth0' | 'ldap' | 'active-directory';
  url: string;
  realm?: string;
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  scopes: string[];
  domain?: string;
}

export interface StorageConfig {
  provider: 'supabase' | 'minio' | 's3' | 'azure' | 'local';
  endpoint: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  publicUrl?: string;
}

export interface APIConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface DeploymentConfig {
  name: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  database: DatabaseConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  api: APIConfig;
  features: {
    realtime: boolean;
    edgeFunctions: boolean;
    monitoring: boolean;
    logging: boolean;
    caching: boolean;
  };
}

export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  cost: 'Low' | 'Low-Medium' | 'Medium' | 'Medium-High' | 'High';
  recommended: boolean;
  config: DeploymentConfig;
  setupSteps: string[];
  dockerCompose?: string;
}

// ============================================================================
// UTILITAIRES — Résolution dynamique des URLs (aucun localhost codé en dur)
// ============================================================================

/**
 * URL publique du frontend (le navigateur). En preview / prod, c'est
 * window.location.origin. En dev local (SSR ou CLI), on retourne '' pour
 * forcer la lecture des variables d'environnement.
 */
function resolveFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/**
 * URL du backend Supabase (GoTrue). Lit la variable VITE_SUPABASE_URL.
 * ⚠️ Ne JAMAIS utiliser le domaine du frontend ici.
 */
function resolveSupabaseUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  return url;
}

/**
 * URL de callback OAuth (destination de Google/GitHub → Supabase).
 * Doit pointer vers Supabase/GoTrue, PAS vers le frontend.
 */
function resolveOAuthCallbackUri(): string {
  const supabaseUrl = resolveSupabaseUrl();
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/auth/v1/callback`;
}

/**
 * URL de retour après login (Supabase → frontend).
 * Doit pointer vers le frontend, PAS vers Supabase.
 */
function resolveOAuthRedirectTo(): string {
  const origin = resolveFrontendOrigin();
  if (!origin) return '';
  return `${origin}/auth/callback`;
}

// ============================================================================

export class ConfigurationService {
  private static instance: ConfigurationService;
  private currentConfig: DeploymentConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  // ============= Configuration Templates =============
  getConfigurationTemplates(): ConfigurationTemplate[] {
    return [
      {
        id: 'supabase',
        name: 'Full Supabase',
        description: 'Easiest deployment with managed services',
        difficulty: 'Easy',
        cost: 'Low-Medium',
        recommended: true,
        config: this.getSupabaseConfig(),
        setupSteps: [
          'Create a Supabase account at supabase.com',
          'Create a new project',
          'Copy the project URL and publishable key',
          'Update your environment variables',
          'Deploy your frontend to Vercel/Netlify',
          'Configure authentication providers in Supabase dashboard'
        ]
      },
      {
        id: 'docker',
        name: 'Self-Hosted Docker',
        description: 'Full control with Docker containers',
        difficulty: 'Medium',
        cost: 'Low',
        recommended: false,
        config: this.getDockerConfig(),
        setupSteps: [
          'Install Docker and Docker Compose',
          'Download the docker-compose.yml file',
          'Run "docker-compose up -d" to start services',
          'Configure Keycloak realm and client',
          'Set up MinIO buckets and policies',
          'Deploy your frontend application'
        ],
        dockerCompose: this.getDockerCompose()
      },
      {
        id: 'hybrid',
        name: 'Cloud Hybrid',
        description: 'Mix of managed and self-hosted services',
        difficulty: 'Hard',
        cost: 'Medium-High',
        recommended: false,
        config: this.getHybridConfig(),
        setupSteps: [
          'Set up Auth0 or preferred auth provider',
          'Create managed database (AWS RDS, Google Cloud SQL)',
          'Configure cloud storage (S3, Azure Blob)',
          'Deploy backend API services',
          'Set up CDN and load balancer',
          'Deploy frontend application'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise On-Premise',
        description: 'Full enterprise deployment',
        difficulty: 'Expert',
        cost: 'High',
        recommended: false,
        config: this.getEnterpriseConfig(),
        setupSteps: [
          'Set up on-premise infrastructure',
          'Install and configure Keycloak with LDAP/AD',
          'Set up PostgreSQL cluster with high availability',
          'Configure enterprise storage solutions',
          'Implement security policies and monitoring',
          'Deploy and configure all services'
        ]
      }
    ];
  }

  // ============= Configuration Generators =============
  private getSupabaseConfig(): DeploymentConfig {
    return {
      name: 'Supabase Deployment',
      description: 'Full Supabase managed services',
      environment: 'production',
      database: {
        provider: 'supabase',
        host: 'db.your-project.supabase.co',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'your-password',
        ssl: true,
        poolSize: 10,
        timeout: 30000
      },
      auth: {
        provider: 'supabase',
        url: 'https://your-project.supabase.co',
        clientId: 'your-publishable-key',
        clientSecret: 'your-service-role-key',
        // ⚠️ redirectUris = URLs publiques du FRONTEND (après login)
        //    NE PAS confondre avec le CALLBACK OAuth (côté Supabase).
        redirectUris: [
          'https://your-domain.com/auth/callback',
        ],
        scopes: ['openid', 'profile', 'email']
      },
      storage: {
        provider: 'supabase',
        endpoint: 'https://your-project.supabase.co/storage/v1',
        publicUrl: 'https://your-project.supabase.co/storage/v1/object/public'
      },
      api: {
        baseUrl: 'https://your-project.supabase.co/rest/v1',
        timeout: 30000,
        retries: 3
      },
      features: {
        realtime: true,
        edgeFunctions: true,
        monitoring: true,
        logging: true,
        caching: true
      }
    };
  }

  private getDockerConfig(): DeploymentConfig {
    return {
      name: 'Docker Self-Hosted',
      description: 'Full control with Docker containers',
      environment: 'production',
      database: {
        provider: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'etrml',
        username: 'postgres',
        password: 'postgres',
        ssl: false,
        poolSize: 20,
        timeout: 10000
      },
      auth: {
        provider: 'keycloak',
        url: 'http://localhost:8080',
        realm: 'etr-ml',
        clientId: 'etr-ml-frontend',
        // ⚠️ redirectUris = URLs publiques du FRONTEND (après login)
        redirectUris: [
          'https://your-domain.com/auth/callback',
        ],
        scopes: ['openid', 'profile', 'email']
      },
      storage: {
        provider: 'minio',
        endpoint: 'http://localhost:9000',
        bucket: 'etr-ml-storage',
        accessKey: 'minioadmin',
        secretKey: 'minioadmin123',
        publicUrl: 'http://localhost:9000/etr-ml-storage'
      },
      api: {
        baseUrl: 'http://localhost:4000/api',
        timeout: 30000,
        retries: 3
      },
      features: {
        realtime: false,
        edgeFunctions: false,
        monitoring: true,
        logging: true,
        caching: false
      }
    };
  }

  private getHybridConfig(): DeploymentConfig {
    return {
      name: 'Cloud Hybrid',
      description: 'Mix of managed and self-hosted services',
      environment: 'production',
      database: {
        provider: 'postgresql',
        host: 'your-db-host.rds.amazonaws.com',
        port: 5432,
        database: 'etrml',
        username: 'etrml_user',
        password: 'secure-password',
        ssl: true,
        poolSize: 15,
        timeout: 30000
      },
      auth: {
        provider: 'auth0',
        url: 'https://your-domain.auth0.com',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
        redirectUris: [
          'https://your-domain.com/auth/callback',
        ],
        scopes: ['openid', 'profile', 'email', 'read:users']
      },
      storage: {
        provider: 's3',
        endpoint: 'https://s3.amazonaws.com',
        bucket: 'etr-ml-storage',
        region: 'us-east-1',
        accessKey: 'your-access-key',
        secretKey: 'your-secret-key',
        publicUrl: 'https://etr-ml-storage.s3.amazonaws.com'
      },
      api: {
        baseUrl: 'https://api.your-domain.com/api',
        timeout: 30000,
        retries: 3,
        rateLimit: {
          requests: 100,
          windowMs: 60000
        }
      },
      features: {
        realtime: false,
        edgeFunctions: true,
        monitoring: true,
        logging: true,
        caching: true
      }
    };
  }

  private getEnterpriseConfig(): DeploymentConfig {
    return {
      name: 'Enterprise On-Premise',
      description: 'Full enterprise deployment',
      environment: 'production',
      database: {
        provider: 'postgresql',
        host: 'db.company.com',
        port: 5432,
        database: 'etrml',
        username: 'etrml_service',
        password: 'enterprise-password',
        ssl: true,
        poolSize: 25,
        timeout: 45000
      },
      auth: {
        provider: 'keycloak',
        url: 'https://auth.company.com',
        realm: 'company-realm',
        clientId: 'etr-ml-client',
        redirectUris: [
          'https://etr-ml.company.com/auth/callback',
        ],
        scopes: ['openid', 'profile', 'email', 'roles']
      },
      storage: {
        provider: 'local',
        endpoint: 'https://storage.company.com',
        bucket: 'etr-ml-enterprise'
      },
      api: {
        baseUrl: 'https://api.company.com/api',
        timeout: 60000,
        retries: 5,
        rateLimit: {
          requests: 200,
          windowMs: 60000
        }
      },
      features: {
        realtime: false,
        edgeFunctions: false,
        monitoring: true,
        logging: true,
        caching: true
      }
    };
  }

  // ============= Docker Compose Generator =============
  private getDockerCompose(): string {
    return `version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: etrml
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  keycloak:
    image: quay.io/keycloak/keycloak:latest
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USER: keycloak
      KC_DB_PASSWORD: keycloak
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:`;
  }

  // ============= Configuration Validation =============
  validateConfiguration(config: DeploymentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.database.host) errors.push('Database host is required');
    if (!config.database.database) errors.push('Database name is required');
    if (!config.database.username) errors.push('Database username is required');
    if (!config.database.password) errors.push('Database password is required');

    if (!config.auth.url) errors.push('Auth URL is required');
    if (!config.auth.clientId) errors.push('Auth client ID is required');
    if (!config.auth.redirectUris.length) errors.push('At least one redirect URI is required');

    if (!config.storage.endpoint) errors.push('Storage endpoint is required');

    if (!config.api.baseUrl) errors.push('API base URL is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============= Current Configuration Management =============
  getCurrentConfig(): DeploymentConfig | null {
    return this.currentConfig;
  }

  setCurrentConfig(config: DeploymentConfig): void {
    this.currentConfig = config;
  }

  // ============= Adapter Configuration =============
  getAdapterConfig(type: 'database' | 'auth' | 'storage' | 'api'): DatabaseConfig | AuthConfig | StorageConfig | APIConfig {
    if (!this.currentConfig) {
      throw new Error('No configuration set. Call setCurrentConfig() first.');
    }

    switch (type) {
      case 'database':
        return this.currentConfig.database;
      case 'auth':
        return this.currentConfig.auth;
      case 'storage':
        return this.currentConfig.storage;
      case 'api':
        return this.currentConfig.api;
      default:
        throw new Error('Unknown adapter type: ' + type);
    }
  }

  // ============= OAuth Configuration Helper =============
  /**
   * ⚠️ NE PAS CONFONDRE :
   *   - redirect_to / redirectUris     → URL du FRONTEND (après login)
   *   - oauthCallbackUri                → URL de SUPABASE (destination Google/GitHub)
   *
   * Le flux correct :
   *   Frontend → Supabase → Google → Supabase (callback) → Frontend (redirect_to)
   */
  getOAuthConfig(provider: string): {
    setupUrl: string;
    redirectUris: string[];
    setupInstructions: string[];
  } {
    const config = this.getCurrentConfig();
    if (!config) {
      throw new Error('No configuration set');
    }

    // ✅ URL de CALLBACK OAuth (destination Google/GitHub → Supabase)
    const oauthCallbackUri = resolveOAuthCallbackUri()
      || `${config.auth.url.replace(/\/+$/, '')}/auth/v1/callback`;

    // ✅ URL de RETOUR après login (destination Supabase → frontend)
    const frontendOrigin = resolveFrontendOrigin()
      || config.auth.redirectUris[0]
      || '';

    switch (provider) {
      case 'google':
        return {
          setupUrl: 'https://console.cloud.google.com/apis/credentials',
          // ⚠️ Ici on retourne le CALLBACK OAuth (côté Supabase), pas le frontend
          redirectUris: [oauthCallbackUri].filter(Boolean),
          setupInstructions: [
            'Google Cloud Console → APIs & Services → Credentials',
            `URI de redirection autorisés : ${oauthCallbackUri}`,
            `Origines JavaScript autorisées : ${frontendOrigin}`,
            'Vérifiez que le Client Secret dans Supabase = celui de Google Cloud (sans espaces)',
          ]
        };
      case 'keycloak':
        return {
          setupUrl: config.auth.url,
          redirectUris: [oauthCallbackUri].filter(Boolean),
          setupInstructions: [
            `Allez sur ${config.auth.url}/admin`,
            `Sélectionnez le realm : ${config.auth.realm}`,
            'Clients → Sélectionnez votre client',
            `Valid Redirect URIs : ${oauthCallbackUri}`,
            `Web Origins : ${frontendOrigin}`,
          ]
        };
      case 'auth0':
        return {
          setupUrl: 'https://manage.auth0.com',
          redirectUris: [oauthCallbackUri].filter(Boolean),
          setupInstructions: [
            'Auth0 Dashboard → Applications → votre app',
            `Allowed Callback URLs : ${oauthCallbackUri}`,
            `Allowed Web Origins : ${frontendOrigin}`,
            `Allowed Logout URLs : ${frontendOrigin}`,
          ]
        };
      default:
        throw new Error('OAuth provider not supported: ' + provider);
    }
  }
}