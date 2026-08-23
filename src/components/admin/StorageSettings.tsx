
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { setStorageConfig, getStorageConfig, StorageConfig, StorageProvider } from '@/config/storage';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { CheckCircle, XCircle, Database, Folder, Server, Cloud } from 'lucide-react';
import { T } from '@/components/i18n/T';

const StorageSettings = () => {
  const [config, setConfig] = useState<StorageConfig>(getStorageConfig());
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { validateConnection } = useDocumentStorage();

  const storageProviders: { value: StorageProvider; label: string; icon: any }[] = [
    { value: 'supabase', label: 'Supabase Storage', icon: Database },
    { value: 'local', label: 'Local Storage', icon: Folder },
    { value: 'ftp', label: 'FTP Server', icon: Server },
    { value: 's3', label: 'Amazon S3', icon: Cloud },
    { value: 'azure', label: 'Azure Blob Storage', icon: Cloud },
    { value: 'gcs', label: 'Google Cloud Storage', icon: Cloud }
  ];

  const handleConfigChange = (field: keyof StorageConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setStorageConfig(config);
    toast({
      title: "Configuration sauvegardée",
      description: `Fournisseur de stockage défini sur: ${config.provider}`,
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Temporarily apply config for testing
      setStorageConfig(config);
      const isValid = await validateConnection();
      setConnectionStatus(isValid);
      
      toast({
        title: isValid ? "Connexion réussie" : "Échec de la connexion",
        description: isValid 
          ? "La connexion au fournisseur de stockage fonctionne correctement."
          : "Impossible de se connecter au fournisseur de stockage.",
        variant: isValid ? "default" : "destructive"
      });
    } catch (error) {
      setConnectionStatus(false);
      toast({
        title: "Erreur de test",
        description: "Une erreur s'est produite lors du test de connexion.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const renderProviderFields = () => {
    switch (config.provider) {
      case 'supabase':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bucket"><T k="auto.storagesettings.nom_du_bucket" fallback="Nom du bucket" /></Label>
              <Input
                id="bucket"
                value={config.bucket || ''}
                onChange={(e) => handleConfigChange('bucket', e.target.value)}
                placeholder="documents"
              />
            </div>
          </div>
        );
      
      case 'ftp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host"><T k="auto.storagesettings.hote_ftp" fallback="Hôte FTP" /></Label>
                <Input
                  id="host"
                  value={config.host || ''}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  placeholder="ftp.example.com"
                />
              </div>
              <div>
                <Label htmlFor="port"><T k="auto.storagesettings.port" fallback="Port" /></Label>
                <Input
                  id="port"
                  type="number"
                  value={config.port || ''}
                  onChange={(e) => handleConfigChange('port', e.target.value)}
                  placeholder="21"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username"><T k="auto.storagesettings.nom_d_utilisateur" fallback="Nom d'utilisateur" /></Label>
                <Input
                  id="username"
                  value={config.username || ''}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password"><T k="auto.storagesettings.mot_de_passe" fallback="Mot de passe" /></Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="basePath"><T k="auto.storagesettings.chemin_de_base" fallback="Chemin de base" /></Label>
              <Input
                id="basePath"
                value={config.basePath || ''}
                onChange={(e) => handleConfigChange('basePath', e.target.value)}
                placeholder="/uploads"
              />
            </div>
          </div>
        );
      
      case 'local':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="basePath"><T k="auto.storagesettings.chemin_de_base" fallback="Chemin de base" /></Label>
              <Input
                id="basePath"
                value={config.basePath || ''}
                onChange={(e) => handleConfigChange('basePath', e.target.value)}
                placeholder="/uploads"
              />
            </div>
          </div>
        );
      
      case 's3':
      case 'azure':
      case 'gcs':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-md">
              <p className="text-warning">
                Ce fournisseur de stockage n'est pas encore implémenté. 
                Veuillez choisir un autre fournisseur.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Folder className="mr-2 h-5 w-5" />
          <T k="auto.storagesettings.configuration_du_stockage" fallback="Configuration du Stockage" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="provider"><T k="auto.storagesettings.fournisseur_de_stockage" fallback="Fournisseur de stockage" /></Label>
          <Select value={config.provider} onValueChange={(value) => handleConfigChange('provider', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {storageProviders.map((provider) => {
                const IconComponent = provider.icon;
                return (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center">
                      <IconComponent className="mr-2 h-4 w-4" />
                      {provider.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {renderProviderFields()}

        <div className="flex items-center space-x-4">
          <Button onClick={handleSave}>
            <T k="auto.storagesettings.sauvegarder_la_configuration" fallback="Sauvegarder la configuration" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
          
          {connectionStatus !== null && (
            <div className="flex items-center">
              {connectionStatus ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2"><T k="auto.storagesettings.configuration_actuelle" fallback="Configuration actuelle" /></h4>
          <p className="text-primary">
            <T k="auto.storagesettings.fournisseur" fallback="Fournisseur:" /> <strong>{config.provider}</strong>
          </p>
          {config.bucket && (
            <p className="text-primary">
              <T k="auto.storagesettings.bucket" fallback="Bucket:" /> <strong>{config.bucket}</strong>
            </p>
          )}
          {config.host && (
            <p className="text-primary">
              <T k="auto.storagesettings.hote" fallback="Hôte:" /> <strong>{config.host}:{config.port || 21}</strong>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageSettings;
