
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
              <Label htmlFor="bucket">Nom du bucket</Label>
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
                <Label htmlFor="host">Hôte FTP</Label>
                <Input
                  id="host"
                  value={config.host || ''}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  placeholder="ftp.example.com"
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
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
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={config.username || ''}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={config.password || ''}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="basePath">Chemin de base</Label>
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
              <Label htmlFor="basePath">Chemin de base</Label>
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
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
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
          Configuration du Stockage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="provider">Fournisseur de stockage</Label>
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
            Sauvegarder la configuration
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
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Configuration actuelle</h4>
          <p className="text-blue-800">
            Fournisseur: <strong>{config.provider}</strong>
          </p>
          {config.bucket && (
            <p className="text-blue-800">
              Bucket: <strong>{config.bucket}</strong>
            </p>
          )}
          {config.host && (
            <p className="text-blue-800">
              Hôte: <strong>{config.host}:{config.port || 21}</strong>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageSettings;
