
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Key, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { keycloakConfig } from '@/integrations/keycloak/config';

const KeycloakSettings = () => {
  const [url, setUrl] = useState<string>('');
  const [realm, setRealm] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Load current configuration
    setUrl(keycloakConfig.url || '');
    setRealm(keycloakConfig.realm || '');
    setClientId(keycloakConfig.clientId || '');
  }, []);

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      // Here we would attempt to connect to Keycloak
      // For now, we'll simulate a successful connection if all fields are filled
      if (url && realm && clientId) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsConnected(true);
        toast({
          title: "Connection successful",
          description: `Connected to Keycloak at ${url}`,
        });
      } else {
        throw new Error("All fields are required");
      }
    } catch (error) {
      console.error('Error connecting to Keycloak:', error);
      toast({
        title: "Connection failed",
        description: "Could not connect to Keycloak with these settings",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, we would save these to environment variables or secure storage
      // For demo purposes, we'll just show a success toast
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, we would update these securely
      // keycloakConfig.url = url;
      // keycloakConfig.realm = realm;
      // keycloakConfig.clientId = clientId;
      
      toast({
        title: "Settings saved",
        description: "Keycloak configuration has been updated",
      });
    } catch (error) {
      console.error('Error saving Keycloak settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Keycloak settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="mr-2 h-5 w-5" />
          Keycloak Configuration
        </CardTitle>
        <CardDescription>
          Configure your Keycloak authentication settings for the application.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keycloak-url">Keycloak URL</Label>
            <Input
              id="keycloak-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keycloak-realm">Realm</Label>
            <Input
              id="keycloak-realm"
              value={realm}
              onChange={(e) => setRealm(e.target.value)}
              placeholder="etr-ml"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="keycloak-client">Client ID</Label>
            <Input
              id="keycloak-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="etr-ml-frontend"
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : isConnected ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Connected
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
        
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default KeycloakSettings;
