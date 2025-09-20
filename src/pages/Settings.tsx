import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Shield, Cog, Folder, Cloud, Settings2, AlertTriangle } from "lucide-react";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DatabaseSettings from '@/components/admin/DatabaseSettings';
import KeycloakSettings from '@/components/admin/KeycloakSettings';
import KeycloakConfigurationTab from '@/components/admin/KeycloakConfigurationTab';
import StorageSettings from '@/components/admin/StorageSettings';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { DEV_ROLES, getActiveDevRole, setActiveDevRole } from '@/config/constants';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import ProviderSettings from '@/components/admin/ProviderSettings';
import DeploymentSettings from '@/components/admin/DeploymentSettings';
import EscalationThresholdsSettings from '@/components/admin/EscalationThresholdsSettings';
import AlertsProcessorSettings from '@/components/admin/AlertsProcessorSettings';

const Settings = () => {
  const { t } = useLanguage();
  const { isDevelopmentMode } = useAuth();
  const [activeTab, setActiveTab] = useState("database");
  const [activeDevRole, setDevRole] = useState(getActiveDevRole());
  const { toast } = useToast();

  const handleRoleChange = (role: string) => {
    setActiveDevRole(role);
    setDevRole(DEV_ROLES.find(r => r.role === role) || DEV_ROLES[0]);
    
    toast({
      title: t("settings.dev_role_updated"),
      description: t("settings.dev_role_changed").replace('{role}', role),
    });

    // Force reload to apply role changes
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{t("settings.title")}</h1>
          
          {isDevelopmentMode && (
            <Card className="mb-8 border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  {t("settings.dev_mode_active")}
                </CardTitle>
                <CardDescription>
                  {t("settings.dev_mode_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p className="font-medium">
                    {t("settings.current_role")}: <span className="text-amber-700">{activeDevRole.role}</span>
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DEV_ROLES.map((roleOption) => (
                      <Button
                        key={roleOption.role}
                        variant={roleOption.role === activeDevRole.role ? "default" : "outline"}
                        className={roleOption.role === activeDevRole.role ? "bg-amber-600 hover:bg-amber-700" : ""}
                        onClick={() => handleRoleChange(roleOption.role)}
                      >
                        {roleOption.role}
                      </Button>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    {activeDevRole.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 mb-8">
              <TabsTrigger value="providers" className="flex items-center">
                <Cloud className="mr-2 h-4 w-4" /> Providers
              </TabsTrigger>
              <TabsTrigger value="deployment" className="flex items-center">
                <Settings2 className="mr-2 h-4 w-4" /> Deployment
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center">
                <Database className="mr-2 h-4 w-4" /> {t("settings.tabs.database")}
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center">
                <Folder className="mr-2 h-4 w-4" /> {t("settings.tabs.storage")}
              </TabsTrigger>
              <TabsTrigger value="keycloak" className="flex items-center">
                <Key className="mr-2 h-4 w-4" /> {t("settings.tabs.keycloak")}
              </TabsTrigger>
              <TabsTrigger value="keycloak-config" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" /> {t("settings.tabs.keycloak_config")}
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" /> {t("settings.tabs.system")}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4" /> Alertes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="providers">
              <ProviderSettings />
            </TabsContent>
            
            <TabsContent value="deployment">
              <DeploymentSettings />
            </TabsContent>
            
            <TabsContent value="database">
              <DatabaseSettings />
            </TabsContent>
            
            <TabsContent value="storage">
              <StorageSettings />
            </TabsContent>
            
            <TabsContent value="keycloak">
              <KeycloakSettings />
            </TabsContent>
            
            <TabsContent value="keycloak-config">
              <KeycloakConfigurationTab />
            </TabsContent>
            
            <TabsContent value="system">
              <EscalationThresholdsSettings />
            </TabsContent>
            
            <TabsContent value="alerts">
              <AlertsProcessorSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
