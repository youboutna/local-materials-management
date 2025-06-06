import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Database, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DatabaseConfig, DatabaseProvider, setDatabaseConfig, getDatabaseConfig } from '@/config/database';
import { dbManager } from '@/lib/database/DatabaseFactory';
import { useLanguage } from '@/contexts/LanguageContext';

const DatabaseSettings = () => {
  const { t } = useLanguage();
  const [provider, setProvider] = useState<DatabaseProvider>('supabase');
  const [host, setHost] = useState<string>('');
  const [port, setPort] = useState<number>(5432);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [database, setDatabase] = useState<string>('');
  const [ssl, setSSL] = useState<boolean>(true);
  const [connectionString, setConnectionString] = useState<string>('');
  const [useConnectionString, setUseConnectionString] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Load current configuration on component mount
  useEffect(() => {
    const config = getDatabaseConfig();
    setProvider(config.provider);
    if (config.host) setHost(config.host);
    if (config.port) setPort(config.port);
    if (config.username) setUsername(config.username);
    if (config.database) setDatabase(config.database);
    if (config.url) {
      setConnectionString(config.url);
      setUseConnectionString(true);
    }
    setSSL(config.ssl !== undefined ? config.ssl : true);
    
    setIsConnected(dbManager.isInitialized());
  }, []);

  const handleTestConnection = async () => {
    setIsLoading(true);
    
    try {
      const configToTest: DatabaseConfig = {
        provider,
      };
      
      if (provider !== 'supabase') {
        if (useConnectionString) {
          configToTest.url = connectionString;
        } else {
          configToTest.host = host;
          configToTest.port = port;
          configToTest.username = username;
          configToTest.password = password;
          configToTest.database = database;
          configToTest.ssl = ssl;
        }
      }
      
      const connected = await dbManager.initialize(configToTest);
      
      if (connected) {
        setIsConnected(true);
        toast({
          title: t("database_settings.success_title"),
          description: t("database_settings.success_desc")+':' +{ provider },
        });
      } else {
        toast({
          title: t("database_settings.failure_title"),
          description: t("database_settings.failure_desc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting to database:', error);
      toast({
        title: t("database_settings.error_title"),
        description: t("database_settings.error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    try {
      const newConfig: DatabaseConfig = {
        provider,
      };
      
      if (provider !== 'supabase') {
        if (useConnectionString) {
          newConfig.url = connectionString;
        } else {
          newConfig.host = host;
          newConfig.port = port;
          newConfig.username = username;
          newConfig.password = password;
          newConfig.database = database;
          newConfig.ssl = ssl;
        }
      }
      
      setDatabaseConfig(newConfig);
      
      toast({
        title: t("database_settings.save_success_title"),
        description: t("database_settings.save_success_desc"),
      });
    } catch (error) {
      console.error('Error saving database settings:', error);
      toast({
        title: t("database_settings.save_error_title"),
        description: t("database_settings.save_error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          {t("database_settings.title")}
        </CardTitle>
        <CardDescription>
          {t("database_settings.desc")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="database-provider">{t("database_settings.provider")}</Label>
            <RadioGroup
              id="database-provider"
              value={provider}
              onValueChange={(value) => setProvider(value as DatabaseProvider)}
              className="grid grid-cols-3 gap-4 mt-2"
            >
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="supabase" id="supabase" />
                <Label htmlFor="supabase" className="cursor-pointer font-medium">Supabase</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="postgresql" id="postgresql" />
                <Label htmlFor="postgresql" className="cursor-pointer font-medium">PostgreSQL</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="mysql" id="mysql" />
                <Label htmlFor="mysql" className="cursor-pointer font-medium">MySQL</Label>
              </div>
            </RadioGroup>
          </div>
          
          {provider !== 'supabase' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-connection-string"
                  checked={useConnectionString}
                  onCheckedChange={setUseConnectionString}
                />
                <Label htmlFor="use-connection-string">{t("database_settings.use_connection_string")}</Label>
              </div>
              
              {useConnectionString ? (
                <div className="space-y-2">
                  <Label htmlFor="connection-string">{t("database_settings.connection_string")}</Label>
                  <Input
                    id="connection-string"
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder={`${provider === 'postgresql' ? 'postgresql://' : 'mysql://'}utilisateur:mot_de_passe@hote:port/base_de_donnees`}
                    className="font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="host">{t("database_settings.host")}</Label>
                      <Input
                        id="host"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">{t("database_settings.port")}</Label>
                      <Input
                        id="port"
                        type="number"
                        value={port}
                        onChange={(e) => setPort(parseInt(e.target.value) || 0)}
                        placeholder={provider === 'postgresql' ? '5432' : '3306'}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">{t("database_settings.username")}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="postgres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t("database_settings.password")}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="database">{t("database_settings.database")}</Label>
                    <Input
                      id="database"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="ma_base_de_donnees"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ssl"
                      checked={ssl}
                      onCheckedChange={setSSL}
                    />
                    <Label htmlFor="ssl">{t("database_settings.ssl")}</Label>
                  </div>
                </div>
              )}
            </div>
          )}
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
              {t("database_settings.testing")}
            </>
          ) : isConnected ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              {t("database_settings.connected")}
            </>
          ) : (
            t("database_settings.test")
          )}
        </Button>
        
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {t("database_settings.save")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseSettings;
