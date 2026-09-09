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
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';

const ProviderSettings = () => {
  const { t } = useLanguage();
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
      label: t('auto.providersettings.mode_a_supabase_cloud'),
      auth: 'supabase',
      data: 'supabase',
      storage: 'supabase',
      description: t('auto.providersettings.managed_supabase_saas_full'),
    },
    {
      id: 'supabase-self-hosted',
      label: t('auto.providersettings.mode_a_self_hosted_sdk'),
      auth: 'supabase',
      data: 'supabase',
      storage: 'supabase',
      description: t('auto.providersettings.stack_supabase_self_hostee_kong_gotrue_postgrest'),
    },
    {
      id: 'local-selfhosted-data',
      label: t('auto.providersettings.mode_b_local_users_self_hosted_data'),
      auth: 'local',
      data: 'supabase',
      storage: 'supabase',
      description: t('auto.providersettings.dev_users_locaux_jwt_hs256_accepte_par_la_rls_se'),
    },
    {
      id: 'postgrest-oss',
      label: t('auto.providersettings.oss_legere_gotrue_postgrest'),
      auth: 'gotrue',
      data: 'postgrest',
      storage: 's3',
      description: t('auto.providersettings.gotrue_postgrest_minio'),
    },
    {
      id: 'sso-enterprise',
      label: t('auto.providersettings.sso_entreprise_keycloak'),
      auth: 'keycloak',
      data: 'postgrest',
      storage: 's3',
      description: t('auto.providersettings.keycloak_postgrest_minio'),
    },
    {
      id: 'local-dev',
      label: t('auto.providersettings.mode_c_local_dev_offline'),
      auth: 'local',
      data: 'local',
      storage: 'local',
      description: t('auto.providersettings.tout_local_aucun_reseau'),
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
    { value: 'supabase', label: t('auto.providersettings.supabase_auth'), description: t('auto.providersettings.managed_authentication_with_social_providers') },
    { value: 'keycloak', label: t('auto.providersettings.keycloak'), description: t('auto.providersettings.enterprise_sso_and_identity_management') },
    { value: 'auth0', label: t('auto.providersettings.auth0'), description: t('auto.providersettings.universal_authentication_authorization_platform') },
    { value: 'custom', label: t('auto.providersettings.custom'), description: t('auto.providersettings.custom_authentication_implementation') }
  ];

  const databaseProviders: { value: DatabaseProvider; label: string; description: string }[] = [
    { value: 'supabase', label: t('auto.providersettings.supabase'), description: t('auto.providersettings.managed_postgresql_with_real_time_features') },
    { value: 'postgresql', label: t('auto.providersettings.postgresql'), description: t('auto.providersettings.direct_postgresql_connection') },
    { value: 'mysql', label: t('auto.providersettings.mysql'), description: t('auto.providersettings.mysql_database_connection') }
  ];

  const storageProviders: { value: StorageProvider; label: string; description: string }[] = [
    { value: 'supabase', label: t('auto.providersettings.supabase_storage'), description: t('auto.providersettings.managed_object_storage_with_cdn') },
    { value: 'minio', label: t('auto.providersettings.minio'), description: t('auto.providersettings.self_hosted_s3_compatible_storage') },
    { value: 's3', label: t('auto.providersettings.amazon_s3'), description: t('auto.providersettings.aws_simple_storage_service') },
    { value: 'azure', label: t('auto.providersettings.azure_blob'), description: t('auto.providersettings.microsoft_azure_blob_storage') },
    { value: 'gcs', label: t('auto.providersettings.google_cloud'), description: t('auto.providersettings.google_cloud_storage') },
    { value: 'ftp', label: t('auto.providersettings.ftp_sftp'), description: t('auto.providersettings.file_transfer_protocol_storage') },
    { value: 'local', label: t('auto.providersettings.local_storage'), description: t('auto.providersettings.local_file_system_storage') }
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
        return <Check className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
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
              <T k="auto.providersettings.provider_configuration" fallback="Provider Configuration" />
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
              <p className="text-sm font-semibold"><T k="auto.providersettings.auth_provider" fallback="Auth Provider" /></p>
              <p className="text-sm text-muted-foreground">{envConfig.auth.provider}</p>
            </div>
            <div>
              <p className="text-sm font-semibold"><T k="auto.providersettings.data_provider" fallback="Data Provider" /></p>
              <p className="text-sm text-muted-foreground">{envConfig.database.provider}</p>
            </div>
            <div>
              <p className="text-sm font-semibold"><T k="auto.providersettings.storage_provider" fallback="Storage Provider" /></p>
              <p className="text-sm text-muted-foreground">{envConfig.storage.provider}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><T k="auto.providersettings.scenarios_de_deploiement" fallback="Scénarios de déploiement" /></CardTitle>
          <CardDescription>
            <T k="auto.providersettings.choisissez_un_scenario_pour_initialiser_les_prov" fallback="Choisissez un scénario pour initialiser les providers recommandés." />
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
              <T k="auto.providersettings.authentication_provider" fallback="Authentication Provider" />
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.auth)}
              {getStatusBadge(connectionStatus.auth)}
            </div>
          </CardTitle>
          <CardDescription>
            <T k="auto.providersettings.choose_your_authentication_provider_and_configur" fallback="Choose your authentication provider and configure connection settings." />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth-provider"><T k="auto.providersettings.provider" fallback="Provider" /></Label>
              <Select
                value={config.auth.provider}
                onValueChange={(value) => handleProviderChange('auth', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auto.providersettings.select_auth_provider')} />
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
                <Label htmlFor="auth-client-id"><T k="auto.providersettings.client_id" fallback="Client ID" /></Label>
                <Input
                  id="auth-client-id"
                  value={config.auth.clientId || ''}
                  onChange={(e) => handleConfigChange('auth', 'clientId', e.target.value)}
                  placeholder="your-client-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth-realm"><T k="auto.providersettings.realm" fallback="Realm" /></Label>
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
            <T k="auto.providersettings.test_connection" fallback="Test Connection" />
          </Button>
        </CardContent>
      </Card>

      {/* Database Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              <T k="auto.providersettings.database_provider" fallback="Database Provider" />
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.database)}
              {getStatusBadge(connectionStatus.database)}
            </div>
          </CardTitle>
          <CardDescription>
            <T k="auto.providersettings.configure_your_database_connection_and_provider_" fallback="Configure your database connection and provider settings." />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db-provider"><T k="auto.providersettings.provider" fallback="Provider" /></Label>
              <Select
                value={config.database.provider}
                onValueChange={(value) => handleProviderChange('database', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auto.providersettings.select_database_provider')} />
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
              <Label htmlFor="db-url"><T k="auto.providersettings.connection_url" fallback="Connection URL" /></Label>
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
            <T k="auto.providersettings.test_connection" fallback="Test Connection" />
          </Button>
        </CardContent>
      </Card>

      {/* Storage Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <HardDrive className="mr-2 h-5 w-5" />
              <T k="auto.providersettings.storage_provider" fallback="Storage Provider" />
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(connectionStatus.storage)}
              {getStatusBadge(connectionStatus.storage)}
            </div>
          </CardTitle>
          <CardDescription>
            <T k="auto.providersettings.configure_file_storage_and_content_delivery_sett" fallback="Configure file storage and content delivery settings." />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storage-provider"><T k="auto.providersettings.provider" fallback="Provider" /></Label>
              <Select
                value={config.storage.provider}
                onValueChange={(value) => handleProviderChange('storage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auto.providersettings.select_storage_provider')} />
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
              <Label htmlFor="storage-endpoint"><T k="auto.providersettings.endpoint" fallback="Endpoint" /></Label>
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
              <Label htmlFor="storage-region"><T k="auto.providersettings.region" fallback="Region" /></Label>
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
            <T k="auto.providersettings.test_connection" fallback="Test Connection" />
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              <T k="auto.providersettings.reset_to_defaults" fallback="Reset to Defaults" />
            </Button>

            <Button
              onClick={saveConfiguration}
              disabled={!isModified}
              className="bg-primary hover:bg-primary/90"
            >
              <T k="auto.providersettings.save_configuration" fallback="Save Configuration" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderSettings;