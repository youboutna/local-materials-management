
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Shield, Cog } from "lucide-react";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DatabaseSettings from '@/components/admin/DatabaseSettings';
import KeycloakSettings from '@/components/admin/KeycloakSettings';
import KeycloakConfigurationTab from '@/components/admin/KeycloakConfigurationTab';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { DEV_ROLES, getActiveDevRole, setActiveDevRole } from '@/config/constants';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { isDevelopmentMode } = useAuth();
  const [activeTab, setActiveTab] = useState("database");
  const [activeDevRole, setDevRole] = useState(getActiveDevRole());
  const { toast } = useToast();

  const handleRoleChange = (role: string) => {
    setActiveDevRole(role);
    setDevRole(DEV_ROLES.find(r => r.role === role) || DEV_ROLES[0]);
    
    toast({
      title: "Dev mode role updated",
      description: `Role changed to: ${role}`,
    });

    // Force reload to apply role changes
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          
          {isDevelopmentMode && (
            <Card className="mb-8 border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Development Mode Active
                </CardTitle>
                <CardDescription>
                  Authentication is bypassed. You can switch between different roles to test your application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <p className="font-medium">Current Role: <span className="text-amber-700">{activeDevRole.role}</span></p>
                  
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
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="database" className="flex items-center">
                <Database className="mr-2 h-4 w-4" /> Database
              </TabsTrigger>
              <TabsTrigger value="keycloak" className="flex items-center">
                <Key className="mr-2 h-4 w-4" /> Keycloak
              </TabsTrigger>
              <TabsTrigger value="keycloak-config" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" /> Keycloak Config
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center">
                <Cog className="mr-2 h-4 w-4" /> System
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="database">
              <DatabaseSettings />
            </TabsContent>
            
            <TabsContent value="keycloak">
              <KeycloakSettings />
            </TabsContent>
            
            <TabsContent value="keycloak-config">
              <KeycloakConfigurationTab />
            </TabsContent>
            
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings and parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>System settings configuration coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
