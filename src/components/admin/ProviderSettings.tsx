import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAppConfig, AuthProvider, DatabaseProvider, StorageProvider } from '@/config/app';
import { Shield, Database, HardDrive, Cloud, Check, AlertTriangle } from 'lucide-react';

const ProviderSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState(getAppConfig());
  const [isModified, setIsModified] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    auth: 'unknown',
    database: 'unknown',
    storage: 'unknown'
  });

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
    
    // Simulate connection test
    setTimeout(() => {
      const isConnected = Math.random() > 0.3; // 70% success rate for demo
      setConnectionStatus(prev => ({ 
        ...prev, 
        [type]: isConnected ? 'connected' : 'failed' 
      }));
    }, 2000);
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
    // In a real implementation, this would save to a backend or local storage
    localStorage.setItem('app_config', JSON.stringify(config));
    setIsModified(false);
    
    toast({
      title: "Configuration Saved",
      description: "Provider settings have been updated successfully.",
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
          <CardTitle className="flex items-center">
            <Cloud className="mr-2 h-5 w-5" />
            Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure authentication, database, and storage providers for your application.
            Switch between different infrastructure providers based on your deployment needs.
          </CardDescription>
        </CardHeader>
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