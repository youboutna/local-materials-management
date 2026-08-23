import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "@/hooks/use-toast";
import { useAlertsHex } from "@/hooks/hexagonal";
import { AlertData } from "@/dtos/entities";
import {
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  Shield,
  TrendingDown,
} from "lucide-react";
import React from "react";

import { TranslatedSeverity } from '@/components/i18n/TranslatedBadges';
import {
  ALERT_CATEGORIES,
  alertSeverityColor,
} from '@/config/referentials/notifications/alerts.referential';
import { T } from '@/components/i18n/T';
const AlertsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { 
    alerts, 
    isLoading, 
    stats, 
    acknowledgeAlert, 
    filterAlertsByType 
  } = useAlertsHex();

  // Couleurs pilotées par le référentiel système des alertes (aucune couleur en dur)
  const getSeverityColor = (severity: string) => alertSeverityColor(severity);

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "delay":
      case "project_delay":
        return Clock;
      case "payment":
      case "payment_blocked":
      case "financial_risk":
        return DollarSign;
      case "inspection":
      case "inspection_issue":
      case "inspection_overdue":
        return TrendingDown;
      case "guarantee":
      case "bank_guarantee":
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
    toast({
      title: t('dashboard.management_tabs.alerts.acknowledge_success'),
      description: t('dashboard.management_tabs.alerts.acknowledge_description'),
    });
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.total')}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.critical')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.critical}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.high')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.high}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.medium')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats.medium}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.low')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {ALERT_CATEGORIES.map((category) => (
            <TabsTrigger key={category.code} value={category.code}>
              {t(`dashboard.management_tabs.alerts.tabs.${category.code}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {ALERT_CATEGORIES.map((c) => c.code).map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="space-y-4">
              {filterAlertsByType(type).length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {t('dashboard.management_tabs.alerts.none')}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filterAlertsByType(type).map((alert: AlertData) => {
                  const IconComponent = getSeverityIcon(alert.type);
                  const isAcknowledged = alert.acknowledged;
                  return (
                    <Alert
                      key={alert.id}
                      className={`${isAcknowledged ? "opacity-60" : ""}`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.title}
                          <Badge
                            className={`${getSeverityColor(alert.severity)}`}
                          >
                            <TranslatedSeverity code={alert.severity} />
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          {!isAcknowledged && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledge(alert.id)}
                            >
                              {t('dashboard.management_tabs.alerts.acknowledge')}
                            </Button>
                          )}
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.message}
                        {alert.projectTitle && (
                          <div className="mt-1 text-sm">
                            <strong><T k="auto.alertsdashboard.projet" fallback="Projet:" /></strong> {alert.projectTitle}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AlertsDashboard;
