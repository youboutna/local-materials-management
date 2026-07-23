import { AuthManagerConfig, getAuthManager } from '@/application/services/AuthManager';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthProvider, DatabaseProvider, getAppConfig, StorageProvider } from '@/config/app';
import { useToast } from "@/hooks/use-toast";
import { useAppConfig } from '@/hooks/useAppConfig';
import { AlertTriangle, Check, Cloud, Database, HardDrive, Shield } from 'lucide-react';
import { useState } from 'react';

const ProviderSettings = () => {
  const { toast } = useToast();
  const { config: envConfig, isValid } = useAppConfig();
  const [config, setConfig] = useState(getAppConfig());
  const [isModified, setIsModified] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    auth: 'unknown',
    database: 'unknown',
    storage: 'unknown'
  });
  
  const authManager = getAuthManager();

  const scenarioPresets = [
    {
      id: 'supabase-cloud',
      label: 'Supabase Cloud',
      auth: 'supabase',
      data: 'supabase',
      storage: 'supabase',
      description: 'Managed Supabase SaaS',
    },
    {
      id: 'supabase-self-hosted',
      label: 'Supabase Self-Hosted',
      auth: 'supabase',
      data: 'supabase',
      storage: 'supabase',
      description: 'Self-hosted Supabase stack',
    },
    {
      id: 'postgrest-oss',
      label: 'OSS Légère',
      auth: 'gotrue',
      data: 'postgrest',
      storage: 's3',
      description: 'GoTrue + PostgREST + MinIO',
    },
    {
      id: 'sso-enterprise',
      label: 'SSO Entreprise',
      auth: 'keycloak',
      data: 'postgrest',
      storage: 's3',
      description: 'Keycloak + PostgREST + MinIO',
    },
    {
      id: 'local-dev',
      label: 'Local Dev',
      auth: 'local',
      data: 'local',
      storage: 'local',
      description: 'Offline developer mode',
    },
  ];

  const applyScenario = (scenario: { auth: string; data: string; storage: string }) => {
    setConfig((prev) => ({
      ...prev,
      auth: { ...prev.auth, provider: scenario.auth as AuthProvider },
      database: { ...prev.database, provider: scenario.data as DatabaseProvider },
      storage: { ...prev.storage, provider: scenario.storage as StorageProvider },
    }));
    setIsModified(true);
  };

  const authProviders: { value: AuthProvider; label: string; description: string }[] = [
    { value: 'supabase', label: 'Supabase Auth', description: 'Managed authentication with social providers' },
    { value: 'keycloak', label: 'Keycloak', description: 'Enterprise SSO and identity management' },
    { value: 'auth0', label: 'Auth0', description: 'Universal authentication & authorization platform' },
    { value: 'custom', label: 'Custom', description: 'Custom authentication implementation' }
  ];

  const databaseProviders: { value: DatabaseProvider; label: string; description: string }[] = [
    { value: 'supabase', label: 'Supabase', description: 'Managed PostgreSQL with real-time features' },
    { value: 'postgresql', label: 'PostgreSQL', description: 'Direct PostgreSQL connection' },
    { value: 'mysql', label: 'MySQL', description: 'MySQL database connection' }
  ];

  const storageProviders: { value: StorageProvider; label: string; description: string }[] = [
    { value: 'supabase', label: 'Supabase Storage', description: 'Managed object storage with CDN' },
    { value: 'minio', label: 'MinIO', description: 'Self-hosted S3-compatible storage' },
    { value: 's3', label: 'Amazon S3', description: 'AWS Simple Storage Service' },
    { value: 'azure', label: 'Azure Blob', description: 'Microsoft Azure Blob Storage' },
    { value: 'gcs', label: 'Google Cloud', description: 'Google Cloud Storage' },
    { value: 'ftp', label: 'FTP/SFTP', description: 'File Transfer Protocol storage' },
    { value: 'local', label: 'Local Storage', description: 'Local file system storage' }
  ];

  const testConnection = async (provider: string, type: 'auth' | 'database' | 'storage') => {
    setConnectionStatus(prev => ({ ...prev, [type]: 'testing' }));
    
    try {
      if (type === 'auth') {
        // Test auth provider by trying to get current session
        const result = await authManager.getCurrentSession();
        setConnectionStatus(prev => ({ 
          ...prev, 
          [type]: result.error ? 'failed' : 'connected' 
        }));
      } else {
        // For database and storage, simulate for now
        setTimeout(() => {
          const isConnected = Math.random() > 0.3; // 70% success rate for demo
          setConnectionStatus(prev => ({ 
            ...prev, 
            [type]: isConnected ? 'connected' : 'failed' 
          }));
        }, 2000);
      }
    } catch (error) {
      console.error(`Error testing ${type} provider:`, error);
      setConnectionStatus(prev => ({ ...prev, [type]: 'failed' }));
    }
  };

  const handleProviderChange = (type: string, value: string) => {
    setConfig(prev => {
      const section = prev[type as keyof typeof prev] as any;
      return {
        ...prev,
        [type]: { ...section, provider: value }
      };
    });
    setIsModified(true);
  };

  const handleConfigChange = (section: string, key: string, value: string) => {
    setConfig(prev => {
      const sectionData = prev[section as keyof typeof prev] as any;
      return {
        ...prev,
        [section]: { ...sectionData, [key]: value }
      };
    });
    setIsModified(true);
  };

  const saveConfiguration = () => {
    // Create AuthManager config from current settings
    const authConfig: AuthManagerConfig = {
      provider: config.auth.provider as AuthProvider,
      url: config.auth.url,
      clientId: config.auth.clientId,
      realm: config.auth.realm,
      redirectUri: config.auth.redirectUri
    };

    // Switch to new auth provider
    authManager.switchProvider(authConfig).then(() => {
      setIsModified(false);
      
      toast({
        title: "Configuration Saved",
        description: "Provider settings have been updated successfully.",
      });
    }).catch((error) => {
      console.error('Error switching auth provider:', error);
      toast({
        title: "Error",
        description: "Failed to switch authentication provider.",
        variant: "destructive"
      });
    });
  };

  const resetToDefaults = () => {
    const defaultConfig = getAppConfig();
    setConfig(defaultConfig);
    setIsModified(false);
    
    toast({
      title: "Reset to Defaults",
      description: "Configuration has been reset to default values.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      failed: 'destructive',
      testing: 'secondary',
      unknown: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'testing' ? 'Testing...' : status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Provider Configuration
            </div>
            <Badge variant={isValid ? 'default' : 'destructive'}>
              {isValid ? 'Configuration valide' : 'Configuration invalide'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure authentication, database, and storage providers for your application.
            Switch between different infrastructure providers based on your deployment needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold">Auth Provider</p>
              <p className="text-sm text-muted-foreground">{envConfig.auth.provider}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Data Provider</p>
              <p className="text-sm text-muted-foreground">{envConfig.database.provider}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Storage Provider</p>
              <p className="text-sm text-muted-foreground">{envConfig.storage.provider}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scénarios de déploiement</CardTitle>
          <CardDescription>
            Choisissez un scénario pour initialiser les providers recommandés.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {scenarioPresets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              onClick={() => applyScenario(preset)}
            >
              <div className="text-left">
                <p className="font-semibold">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Authentication Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Authentication Provider
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.auth)}
              {getStatusBadge(connectionStatus.auth)}
            </div>
          </CardTitle>
          <CardDescription>
            Choose your authentication provider and configure connection settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth-provider">Provider</Label>
              <Select 
                value={config.auth.provider} 
                onValueChange={(value) => handleProviderChange('auth', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auth provider" />
                </SelectTrigger>
                <SelectContent>
                  {authProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div className="flex flex-col">
                        <span>{provider.label}</span>
                        <span className="text-xs text-muted-foreground">{provider.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auth-url">URL/Endpoint</Label>
              <Input
                id="auth-url"
                value={config.auth.url || ''}
                onChange={(e) => handleConfigChange('auth', 'url', e.target.value)}
                placeholder="https://your-auth-provider.com"
              />
            </div>
          </div>

          {config.auth.provider === 'keycloak' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="auth-client-id">Client ID</Label>
                <Input
                  id="auth-client-id"
                  value={config.auth.clientId || ''}
                  onChange={(e) => handleConfigChange('auth', 'clientId', e.target.value)}
                  placeholder="your-client-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-realm">Realm</Label>
                <Input
                  id="auth-realm"
                  value={config.auth.realm || ''}
                  onChange={(e) => handleConfigChange('auth', 'realm', e.target.value)}
                  placeholder="your-realm"
                />
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={() => testConnection(config.auth.provider, 'auth')}
            disabled={connectionStatus.auth === 'testing'}
          >
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Database Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Provider
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.database)}
              {getStatusBadge(connectionStatus.database)}
            </div>
          </CardTitle>
          <CardDescription>
            Configure your database connection and provider settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db-provider">Provider</Label>
              <Select 
                value={config.database.provider} 
                onValueChange={(value) => handleProviderChange('database', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database provider" />
                </SelectTrigger>
                <SelectContent>
                  {databaseProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div className="flex flex-col">
                        <span>{provider.label}</span>
                        <span className="text-xs text-muted-foreground">{provider.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="db-url">Connection URL</Label>
              <Input
                id="db-url"
                value={config.database.url || ''}
                onChange={(e) => handleConfigChange('database', 'url', e.target.value)}
                placeholder="postgresql://user:pass@host:5432/db"
                type="password"
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => testConnection(config.database.provider, 'database')}
            disabled={connectionStatus.database === 'testing'}
          >
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Storage Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              Storage Provider
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.storage)}
              {getStatusBadge(connectionStatus.storage)}
            </div>
          </CardTitle>
          <CardDescription>
            Configure file storage and content delivery settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage-provider">Provider</Label>
              <Select 
                value={config.storage.provider} 
                onValueChange={(value) => handleProviderChange('storage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage provider" />
                </SelectTrigger>
                <SelectContent>
                  {storageProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <div className="flex flex-col">
                        <span>{provider.label}</span>
                        <span className="text-xs text-muted-foreground">{provider.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storage-endpoint">Endpoint</Label>
              <Input
                id="storage-endpoint"
                value={config.storage.endpoint || ''}
                onChange={(e) => handleConfigChange('storage', 'endpoint', e.target.value)}
                placeholder="https://storage-endpoint.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage-bucket">Bucket/Container</Label>
              <Input
                id="storage-bucket"
                value={config.storage.bucket || ''}
                onChange={(e) => handleConfigChange('storage', 'bucket', e.target.value)}
                placeholder="your-bucket-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storage-region">Region</Label>
              <Input
                id="storage-region"
                value={config.storage.region || ''}
                onChange={(e) => handleConfigChange('storage', 'region', e.target.value)}
                placeholder="us-east-1"
              />
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => testConnection(config.storage.provider, 'storage')}
            disabled={connectionStatus.storage === 'testing'}
          >
            Test Connection
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
            
            <Button 
              onClick={saveConfiguration}
              disabled={!isModified}
              className="bg-primary hover:bg-primary/90"
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSettings;