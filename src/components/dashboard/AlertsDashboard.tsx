import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectProjectDelays } from "@/services/BankGuaranteeService";
import { DELAY_THRESHOLDS } from "@/types/project";
import {
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  Shield,
  TrendingDown,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface AlertData {
  id: string;
  type: "delay" | "payment" | "inspection" | "guarantee";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  timestamp: Date;
  status: "active" | "resolved" | "acknowledged";
}

const AlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });

  const { t } = useLanguage();

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [t]);

  const loadAlerts = async () => {
    try {
      const allAlerts: AlertData[] = [];

      // Load project delays
      const delays = await detectProjectDelays();
      const delayAlerts: AlertData[] = delays
        .filter((delay) => delay.delayPercentage >= DELAY_THRESHOLDS.WARNING)
        .map((delay) => ({
          id: `delay-${delay.projectId}`,
          type: "delay" as const,
          severity: getSeverity(delay.delayPercentage),
          title: `${t('alerts.delay_title')}: ${delay.projectName}`,
          description: `${t('alerts.delay_desc_prefix')} ${delay.delayPercentage.toFixed(1)}% ${t('alerts.delay_desc_suffix')}`,
          projectId: delay.projectId,
          projectName: delay.projectName,
          timestamp: new Date(),
          status: "active" as const,
        }));
      allAlerts.push(...delayAlerts);

      // Fetch blocked payments
      const { data: blockedPayments } = await supabase
        .from("payment_blocks")
        .select(
          `
          id, amount, blocked_at, notes,
          projects (id, title)
        `
        )
        .is("resolved_at", null);

      if (blockedPayments) {
        blockedPayments.forEach((block) => {
            allAlerts.push({
            id: `payment-block-${block.id}`,
            type: "payment",
            severity: "high",
            title: t('alerts.payment_blocked'),
            description: `${t('alerts.payment_blocked_desc_prefix')} ${block.amount.toLocaleString()} ${t('alerts.payment_blocked_desc_suffix')} - ${
              block.notes || t('alerts.validation_required')
            }`,
            projectId: (block.projects as any)?.id,
            projectName: (block.projects as any)?.title,
            timestamp: new Date(block.blocked_at),
            status: "active",
          });
        });
      }

      // Fetch overdue inspections
      const { data: overdueInspections } = await supabase
        .from("inspections")
        .select(
          `
          id, date, inspector, status,
          projects (id, title)
        `
        )
        .lt("date", new Date().toISOString())
        .neq("status", "completed");

      if (overdueInspections) {
        overdueInspections.forEach((inspection) => {
          const daysPast = Math.floor(
            (Date.now() - new Date(inspection.date).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          allAlerts.push({
            id: `inspection-overdue-${inspection.id}`,
            type: "inspection",
            severity: daysPast > 7 ? "high" : "medium",
            title: t('alerts.inspection_overdue'),
            description: `${t('alerts.inspection_overdue_desc_prefix')} ${daysPast} ${t('alerts.days')}`,
            projectId: (inspection.projects as any)?.id,
            projectName: (inspection.projects as any)?.title,
            timestamp: new Date(inspection.date),
            status: "active",
          });
        });
      }

      // Fetch expiring bank guarantees
      const { data: expiringGuarantees } = await supabase
        .from("bank_guarantees")
        .select(
          `
          id, bank_name, expiry_date, guarantee_amount,
          projects (id, title)
        `
        )
        .gte("expiry_date", new Date().toISOString())
        .lte(
          "expiry_date",
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (expiringGuarantees) {
        expiringGuarantees.forEach((guarantee) => {
          const daysLeft = Math.ceil(
            (new Date(guarantee.expiry_date).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          );
          allAlerts.push({
            id: `guarantee-expiring-${guarantee.id}`,
            type: "guarantee",
            severity:
              daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "high" : "medium",
            title: t('alerts.guarantee_expiring'),
            description: `${t('alerts.guarantee_expiring_desc_prefix')} ${guarantee.guarantee_amount.toLocaleString()} ${t('alerts.guarantee_expiring_desc_suffix')} ${daysLeft} ${t('alerts.days')}`,
            projectId: (guarantee.projects as any)?.id,
            projectName: (guarantee.projects as any)?.title,
            timestamp: new Date(),
            status: "active",
          });
        });
      }
      setAlerts(allAlerts);

      // Calculate stats
      const newStats = allAlerts.reduce(
        (acc, alert) => {
          acc[alert.severity]++;
          acc.total++;
          return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
      );

      setStats(newStats);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast({
        title: t('common.error'),
        description: t('dashboard.management_tabs.alerts.load_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (delayPercentage: number): AlertData["severity"] => {
    if (delayPercentage >= DELAY_THRESHOLDS.LEGAL_ESCALATION) return "critical";
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER) return "high";
    if (delayPercentage >= DELAY_THRESHOLDS.WARNING) return "medium";
    return "low";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "delay":
        return Clock;
      case "payment":
        return DollarSign;
      case "inspection":
        return TrendingDown;
      case "guarantee":
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, status: "acknowledged" } : alert
      )
    );
    toast({
      title: t('dashboard.management_tabs.alerts.acknowledge_success'),
      description: t('dashboard.management_tabs.alerts.acknowledge_description'),
    });
  };

  const filterAlertsByType = (type: string) => {
    if (type === "all") return alerts;
    return alerts.filter((alert) => alert.type === type);
  };

  if (loading) {
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
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.critical}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.high')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.high}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.medium')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.medium}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.management_tabs.alerts.low')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">{t('dashboard.management_tabs.alerts.tabs.all')}</TabsTrigger>
          <TabsTrigger value="delay">{t('dashboard.management_tabs.alerts.tabs.delay')}</TabsTrigger>
          <TabsTrigger value="payment">{t('dashboard.management_tabs.alerts.tabs.payment')}</TabsTrigger>
          <TabsTrigger value="inspection">{t('dashboard.management_tabs.alerts.tabs.inspection')}</TabsTrigger>
          <TabsTrigger value="guarantee">{t('dashboard.management_tabs.alerts.tabs.guarantee')}</TabsTrigger>
        </TabsList>

        {["all", "delay", "payment", "inspection", "guarantee"].map((type) => (
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
                filterAlertsByType(type).map((alert) => {
                  const IconComponent = getSeverityIcon(alert.type);
                  return (
                    <Alert
                      key={alert.id}
                      className={`${
                        alert.status === "acknowledged" ? "opacity-60" : ""
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.title}
                          <Badge
                            className={`${getSeverityColor(
                              alert.severity
                            )} text-white`}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                          {alert.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              {t('dashboard.management_tabs.alerts.acknowledge')}
                            </Button>
                          )}
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.description}
                        {alert.projectName && (
                          <div className="mt-1 text-sm">
                            <strong>Projet:</strong> {alert.projectName}
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
