import AlertsProcessorSettings from "@/components/admin/AlertsProcessorSettings";
import DatabaseSettings from "@/components/admin/DatabaseSettings";
import DeploymentSettings from "@/components/admin/DeploymentSettings";
import EscalationThresholdsSettings from "@/components/admin/EscalationThresholdsSettings";
import KeycloakConfigurationTab from "@/components/admin/KeycloakConfigurationTab";
import KeycloakSettings from "@/components/admin/KeycloakSettings";
import LocalUserManagementPanel from "@/components/admin/LocalUserManagementPanel";
import ProviderSettings from "@/components/admin/ProviderSettings";
import StorageSettings from "@/components/admin/StorageSettings";
import { AppLayout } from "@/components/layout";
import { AdminEmailsSettings } from "@/components/settings/AdminEmailsSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppConfig } from '@/hooks/useAppConfig';

import {
  AlertTriangle,
  Cloud,
  Cog,
  Database,
  Folder,
  Key,
  Mail,
  Palette,

  Settings2,
  Users,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { T } from '@/components/i18n/T';
import DevModeSettingsCard from '@/components/dev/DevModeSettingsCard';

type Translate = (key: string) => string;

/** Sections de paramétrage (source unique : onglets desktop + sélecteur mobile). */
const SETTINGS_TABS: Array<{
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  label: (t: Translate) => string;
}> = [
  { value: "appearance", icon: Palette, label: () => "Apparence" },
  { value: "providers", icon: Cloud, label: () => "Providers" },
  { value: "deployment", icon: Settings2, label: () => "Déploiement" },
  { value: "database", icon: Database, label: (t) => t("settings.tabs.database") },
  { value: "storage", icon: Folder, label: (t) => t("settings.tabs.storage") },
  { value: "keycloak", icon: Key, label: (t) => t("settings.tabs.keycloak") },
  { value: "keycloak-config", icon: Cog, label: (t) => t("settings.tabs.keycloak_config") },
  { value: "system", icon: Cog, label: (t) => t("settings.tabs.system") },
  { value: "alerts", icon: AlertTriangle, label: () => "Alertes" },
  { value: "notifications", icon: Mail, label: () => "Emails" },
  { value: "local-users", icon: Users, label: () => "Utilisateurs locaux" },
  { value: "dev", icon: Wrench, label: () => "Mode dev" },
];



const Settings = () => {
  const { t } = useLanguage();
  const { config, isValid } = useAppConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const activeTab =
    urlTab && SETTINGS_TABS.some((s) => s.value === urlTab) ? urlTab : "database";
  const setActiveTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };



  return (
    <AppLayout pageTitle={t("settings.title")}>
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle><T k="auto.settings.configuration_providers" fallback="Configuration providers" /></CardTitle>
                <CardDescription>
                  <T k="auto.settings.statut_des_providers_actuels_et_compatibilite_de" fallback="Statut des providers actuels et compatibilité de la configuration." />
                </CardDescription>
              </div>
              <Badge variant={isValid ? 'default' : 'destructive'}>
                {isValid ? 'Configuration valide' : 'Configuration invalide'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-semibold"><T k="auto.settings.auth_provider" fallback="Auth Provider" /></p>
                <p className="text-sm text-muted-foreground">{config.auth.provider}</p>
              </div>
              <div>
                <p className="text-sm font-semibold"><T k="auto.settings.data_provider" fallback="Data Provider" /></p>
                <p className="text-sm text-muted-foreground">{config.database.provider}</p>
              </div>
              <div>
                <p className="text-sm font-semibold"><T k="auto.settings.storage_provider" fallback="Storage Provider" /></p>
                <p className="text-sm text-muted-foreground">{config.storage.provider}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DevModeSettingsCard />


          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile : sélecteur compact — Desktop : onglets qui passent à la ligne */}
            <div className="mb-6 sm:hidden">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger aria-label="Section des paramètres">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SETTINGS_TABS.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      {tab.label(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsList className="mb-6 hidden h-auto w-full flex-wrap justify-start gap-1 p-1 sm:flex">
              {SETTINGS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label(t)}</span>
                </TabsTrigger>
              ))}
            </TabsList>


            <TabsContent value="appearance">
              <AppearanceSettings />
            </TabsContent>


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

            <TabsContent value="notifications">
              <AdminEmailsSettings />
            </TabsContent>

            <TabsContent value="local-users">
              <LocalUserManagementPanel />
            </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
