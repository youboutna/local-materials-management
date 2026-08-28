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
  Wrench,
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
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Bandeau de statut compact (remplace la grande carte redondante) */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Configuration valide" : "Configuration invalide"}
          </Badge>
          <span className="text-muted-foreground">
            Auth <span className="font-medium text-foreground">{config.auth.provider}</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Data <span className="font-medium text-foreground">{config.database.provider}</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Storage <span className="font-medium text-foreground">{config.storage.provider}</span>
          </span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:flex lg:gap-4">
          {/* Mobile : sélecteur compact */}
          <div className="sm:hidden">
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

          {/* Tablette : onglets en grille — Desktop : navigation verticale */}
          <TabsList className="hidden h-auto w-full flex-wrap justify-start gap-1 p-1 sm:flex lg:w-56 lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-stretch lg:self-start">
            {SETTINGS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 whitespace-nowrap lg:w-full lg:justify-start"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label(t)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 min-w-0 flex-1 lg:mt-0">
            <TabsContent value="appearance" className="mt-0">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="providers" className="mt-0">
              <ProviderSettings />
            </TabsContent>

            <TabsContent value="deployment" className="mt-0">
              <DeploymentSettings />
            </TabsContent>

            <TabsContent value="database" className="mt-0">
              <DatabaseSettings />
            </TabsContent>

            <TabsContent value="storage" className="mt-0">
              <StorageSettings />
            </TabsContent>

            <TabsContent value="keycloak" className="mt-0">
              <KeycloakSettings />
            </TabsContent>

            <TabsContent value="keycloak-config" className="mt-0">
              <KeycloakConfigurationTab />
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <EscalationThresholdsSettings />
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <AlertsProcessorSettings />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <AdminEmailsSettings />
            </TabsContent>

            <TabsContent value="local-users" className="mt-0">
              <LocalUserManagementPanel />
            </TabsContent>

            <TabsContent value="dev" className="mt-0">
              <DevModeSettingsCard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;


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
