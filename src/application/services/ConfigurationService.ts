// Configuration Service - Architecture Hexagonale
// Centralized configuration management for adapters and deployment settings

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
        redirectUris: [
          'http://localhost:3000',
          'https://your-domain.com'
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
        redirectUris: [
          'http://localhost:3000',
          'http://localhost:3000/*'
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
          'https://your-domain.com',
          'https://your-domain.com/*'
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
          'https://etr-ml.company.com',
          'https://etr-ml.company.com/*'
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
    command: ["start-dev"]
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/etrml
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
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

  postgrest:
    image: postgrest/postgrest:latest
    environment:
      PGRST_DB_URI: postgres://postgres:postgres@postgres:5432/etrml
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
      PGRST_SERVER_PROXY_URI: http://localhost:3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:`;
  }

  // ============= Environment Variables Generator =============
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

  // ============= Configuration Management =============
  setCurrentConfig(config: DeploymentConfig): void {
    this.currentConfig = config;
  }

  getCurrentConfig(): DeploymentConfig | null {
    return this.currentConfig;
  }

  getTemplateById(id: string): ConfigurationTemplate | null {
    return this.getConfigurationTemplates().find(template => template.id === id) || null;
  }

  validateConfig(config: DeploymentConfig): { valid: boolean; errors: string[] } {
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
        throw new Error(`Unknown adapter type: ${type}`);
    }
  }

  // ============= OAuth Configuration Helper =============
  getOAuthConfig(provider: string): { 
    setupUrl: string; 
    redirectUris: string[];
    setupInstructions: string[];
  } {
    const config = this.getCurrentConfig();
    if (!config) {
      throw new Error('No configuration set');
    }

    const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    switch (provider) {
      case 'google':
        return {
          setupUrl: 'https://console.cloud.google.com/apis/credentials',
          redirectUris: config.auth.redirectUris,
          setupInstructions: [
            'Go to Google Cloud Console → APIs & Credentials',
            'Select your OAuth 2.0 Client ID',
            'Add the redirect URIs above in the authorized redirect URIs',
            'Configure the consent screen with your authorized domain',
            'In Supabase → Auth → URL Configuration, set Site URL to your domain'
          ]
        };
      case 'keycloak':
        return {
          setupUrl: config.auth.url,
          redirectUris: config.auth.redirectUris,
          setupInstructions: [
            `Go to ${config.auth.url}/admin`,
            `Select realm: ${config.auth.realm}`,
            'Go to Clients → Find your client',
            'Add the redirect URis in Valid Redirect URIs',
            'Configure Web Origins if needed'
          ]
        };
      default:
        throw new Error(`OAuth provider ${provider} not supported`);
    }
  }
}
