// ============================================================
// src/components/alerts/BankGuaranteeMonitor.tsx
// ============================================================
/**
 * Bank Guarantee Monitor
 * ---------------------
 * Surveillance des garanties bancaires avec intégration AlertService
 * Utilise ProjectManagerProvider pour les alertes
 */

import { ActionsDropdown } from "@/components/actions/ActionsDropdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagination } from "@/hooks/usePagination";
import { useBankGuaranteeForProjectHex, useAuthUserHex } from "@/hooks/hexagonal";
import { BankGuaranteeActionService } from '@/application/services/BankGuaranteeActionService';
import { BankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { useProjectManager } from '@/hooks/useProjectManager';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Send,
  ExternalLink,
  CheckCircle,
  Eye,
  Bell,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { DELAY_THRESHOLDS } from "../../dtos/entities/ProjectDTO";

interface ProjectDelay {
  projectId: string;
  projectName: string;
  contractorId?: string;
  contractorName: string;
  delayDays: number;
  delayPercentage: number;
  plannedEndDate: string;
  milestonesMissed: number;
}

// Helper function to detect project delays (mock implementation)
async function detectProjectDelays(): Promise<ProjectDelay[]> {
  // In production, this would query actual project data
  // For now, return empty array - no critical delays
  return [];
}

// Helper function to trigger bank guarantee notification
async function triggerBankGuaranteeNotification(
  delay: ProjectDelay,
  bankGuaranteeData: any
): Promise<{ notificationsSent: number }> {
  console.log('Triggering bank guarantee notification:', { delay, bankGuaranteeData });
  // In production, this would send actual notifications
  return { notificationsSent: 1 };
}

// Helper function to create bank guarantee action
async function createBankGuaranteeAction(actionData: {
  bankGuaranteeId: string;
  projectId: string;
  contractorId: string;
  actionType: string;
  title: string;
  message: string;
  priority: string;
  assigneeId: string;
  recipientIds: string[];
  metadata: any;
}): Promise<void> {
  await BankGuaranteeActionService.create({
    guarantee_id: actionData.bankGuaranteeId,
    action_type: actionData.actionType,
    title: actionData.message,
    description: actionData.message,
    performed_by: actionData.assigneeId,
    created_by: actionData.assigneeId,
    priority: actionData.priority as 'low' | 'medium' | 'high' | 'urgent',
    metadata: actionData.metadata
  });
}

const BankGuaranteeMonitor: React.FC = () => {
  const [delays, setDelays] = useState<ProjectDelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { userId } = useAuthUserHex();

  // ✅ Use ProjectManager for alerts
  const { 
    alerts, 
    state, 
    acknowledgeAlert, 
    resolveAlert, 
    getSummaryStats,
    loading: alertsLoading,
    runChecks 
  } = useProjectManager();

  const {
    currentData: paginatedDelays,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: delays,
    itemsPerPage: 10,
  });

  // Get all alerts from context
  const allAlerts = state?.alerts || alerts || [];
  const stats = getSummaryStats();

  // Filter alerts related to bank guarantees
  const bankGuaranteeAlerts = useMemo(() => {
    return allAlerts.filter((alert: any) => 
      alert.type === 'bank_guarantee' || 
      alert.type === 'guarantee' ||
      alert.source === 'bank_guarantee' ||
      alert.title?.toLowerCase().includes('garantie') ||
      alert.title?.toLowerCase().includes('bank')
    );
  }, [allAlerts]);

  // Get critical alerts count
  const criticalAlerts = useMemo(() => {
    return bankGuaranteeAlerts.filter((alert: any) => 
      alert.severity === 'critical' || alert.severity === 'high'
    );
  }, [bankGuaranteeAlerts]);

  // ============================================================
  // Alert Handlers
  // ============================================================
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, userId || 'system-user', 'Traité depuis BankGuaranteeMonitor');
      await runChecks();
      toast({
        title: t('common.success'),
        description: t('bank_guarantee.alert_acknowledged'),
      });
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
      toast({
        title: t('common.error'),
        description: t('bank_guarantee.alert_acknowledge_error'),
        variant: "destructive",
      });
    }
  }, [acknowledgeAlert, runChecks, userId, toast, t]);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    try {
      await resolveAlert(alertId, userId || 'system-user', 'Garantie traitée');
      await runChecks();
      toast({
        title: t('common.success'),
        description: t('bank_guarantee.alert_resolved'),
      });
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      toast({
        title: t('common.error'),
        description: t('bank_guarantee.alert_resolve_error'),
        variant: "destructive",
      });
    }
  }, [resolveAlert, runChecks, userId, toast, t]);

  // ============================================================
  // Load Delays
  // ============================================================
  useEffect(() => {
    loadDelays();
    // Check for delays every hour
    const interval = setInterval(loadDelays, 3600000);
    return () => clearInterval(interval);
  }, []);

  const loadDelays = async () => {
    try {
      const projectDelays = await detectProjectDelays();
      const criticalDelays = projectDelays.filter(
        (delay) => delay.delayPercentage >= DELAY_THRESHOLDS.WARNING
      );
      setDelays(criticalDelays);
    } catch (error) {
        console.error("Error loading delays:", error);
        toast({
          title: t('common.error'),
          description: t('bank_guarantee.load_delays_error'),
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Bank Guarantee Handlers
  // ============================================================
  const handleTriggerBankNotification = async (delay: ProjectDelay) => {
    setProcessing(delay.projectId);
    try {
      // Get real bank guarantee data from service
      const guarantees = await BankGuaranteeService.getByProjectId(delay.projectId);
      const guarantee = guarantees.find(g => g.status === 'active');

      if (!guarantee) {
        console.error("Bank guarantee not found for project");
        toast({
          title: t('common.error'),
          description: t('bank_guarantee.not_found_for_project'),
          variant: "destructive",
        });
        return;
      }

      const bankName = guarantee.bank_name || guarantee.issuingBank || 'bank';
      const bankGuaranteeData = {
        projectId: delay.projectId,
        contractorId: guarantee.contractor_id || guarantee.contractorId,
        bankLiaisonEmail: `contact@${bankName
          .toLowerCase()
          .replace(/\s+/g, "")}.mr`,
        guaranteeAmount: guarantee.guarantee_amount || guarantee.amount,
        delayPercentage: delay.delayPercentage,
        contractClause: "Article 15.3 - Garantie de bonne exécution",
      };

      const result = await triggerBankGuaranteeNotification(
        delay,
        bankGuaranteeData
      );

      toast({
        title: t('common.success'),
        description: `${t('bank_guarantee.bank_notified_prefix')} "${delay.projectName}". ${result.notificationsSent} ${t('bank_guarantee.internal_notifications_sent')}.`,
      });

      // Remove from current delays list
      setDelays((prev) => prev.filter((d) => d.projectId !== delay.projectId));
      
      // Refresh alerts
      await runChecks();
    } catch (error) {
      console.error("Error triggering bank notification:", error);
      toast({
        title: t('common.error'),
        description: t('bank_guarantee.notification_send_failed'),
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleBankGuaranteeAction = async (
    projectId: string,
    actionType: string
  ) => {
    try {
      const delay = delays.find((d) => d.projectId === projectId);
      if (!delay) {
        toast({
          title: t('common.error'),
          description: t('bank_guarantee.project_not_found'),
          variant: "destructive",
        });
        return;
      }

      // Use userId from hexagonal hook
      const currentUserId = userId || "system-user";

      let title = "";
      let message = "";

      switch (actionType) {
        case "task_assignment":
          title = t('bank_guarantee.actions.task_assignment_title');
          message = `${t('bank_guarantee.actions.task_assignment_msg_prefix')} ${delay.delayDays} ${t('bank_guarantee.days_label')} - ${delay.projectName}`;
          break;
        case "hierarchy_notification":
          title = t('bank_guarantee.actions.hierarchy_notification_title');
          message = `${t('bank_guarantee.actions.hierarchy_notification_msg_prefix')} ${delay.projectName} ${t('bank_guarantee.delay_percent_prefix')} ${delay.delayPercentage}%`;
          break;
        case "sms":
          title = t('bank_guarantee.actions.sms_title');
          message = `${t('bank_guarantee.actions.sms_msg_prefix')} ${delay.delayDays} ${t('bank_guarantee.days_label')} - ${delay.projectName}`;
          break;
        case "call":
          title = t('bank_guarantee.actions.call_title');
          message = `${t('bank_guarantee.actions.call_msg_prefix')} ${delay.projectName}`;
          break;
        case "email":
          title = t('bank_guarantee.actions.email_title');
          message = `${t('bank_guarantee.actions.email_msg_prefix')} ${delay.projectName}`;
          break;
        case "mail":
          title = t('bank_guarantee.actions.mail_title');
          message = `${t('bank_guarantee.actions.mail_msg_prefix')} ${delay.projectName}`;
          break;
        default:
          toast({
              title: t('common.error'),
              description: t('bank_guarantee.unknown_action_type'),
              variant: "destructive",
            });
          return;
      }

      await createBankGuaranteeAction({
        bankGuaranteeId: `bg-${projectId}`,
        projectId,
        contractorId: delay.contractorId || "demo-contractor-001",
        actionType: actionType,
        title,
        message,
        priority: "urgent",
        assigneeId: currentUserId,
        recipientIds: [currentUserId],
        metadata: { delayData: delay },
      });

      toast({
        title: t('common.success'),
        description: t('bank_guarantee.action_created_success', { title }),
      });
      
      // Refresh alerts after action
      await runChecks();
    } catch (error: any) {
      console.error("Error creating bank guarantee action:", error);
      toast({
        title: t('common.error'),
        description: `Impossible de créer l'action: ${
          error?.message || "Erreur inconnue"
        }`,
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (delayPercentage: number) => {
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER)
      return "destructive";
    if (delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION) return "default";
    return "secondary";
  };

  const getSeverityLabel = (delayPercentage: number) => {
    if (delayPercentage >= DELAY_THRESHOLDS.GUARANTEE_TRIGGER)
      return t('bank_guarantee.severity_labels.guarantee_trigger');
    if (delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION)
      return t('bank_guarantee.severity_labels.bank_notification');
    return t('bank_guarantee.severity_labels.delay_alert');
  };

  // ============================================================
  // Loading States
  // ============================================================
  if (loading || alertsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Alert Stats Summary */}
      {bankGuaranteeAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              {t('bank_guarantee.alerts_title')}
              <Badge variant="destructive">{bankGuaranteeAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bankGuaranteeAlerts.map((alert: any) => (
                <div 
                  key={alert.id} 
                  className={`p-3 bg-white border rounded-lg flex items-center justify-between ${
                    alert.severity === 'critical' ? 'border-red-300' :
                    alert.severity === 'high' ? 'border-orange-300' :
                    'border-yellow-300'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <p className="font-medium text-sm">{alert.title || alert.message}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {alert.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          alert.severity === 'critical' ? 'text-red-600 border-red-200' :
                          alert.severity === 'high' ? 'text-orange-600 border-orange-200' :
                          'text-yellow-600 border-yellow-200'
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleString('fr-FR')}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {alert.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'open' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('common.acknowledge')}
                      </Button>
                    )}
                    {(alert.status === 'open' || alert.status === 'acknowledged') && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('common.resolve')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('bank_guarantee.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {delays.length === 0 && bankGuaranteeAlerts.length === 0 ? (
            <Alert>
              <AlertTitle>{t('bank_guarantee.no_critical_delays_title')}</AlertTitle>
              <AlertDescription>
                {t('bank_guarantee.no_critical_delays_desc')}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {delays.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {`⚠️ ${delays.length} ${t('bank_guarantee.critical_projects')}`}
                  </AlertTitle>
                  <AlertDescription>
                    {t('bank_guarantee.critical_alerts_desc')}
                  </AlertDescription>
                </Alert>
              )}

              {paginatedDelays.map((delay) => (
                <Card
                  key={delay.projectId}
                  className="border-l-4 border-l-red-500"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {delay.projectName}
                          </h3>
                          <Badge
                            variant={getSeverityColor(delay.delayPercentage)}
                          >
                            {getSeverityLabel(delay.delayPercentage)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {t('bank_guarantee.delay_label')}: {delay.delayDays} {t('bank_guarantee.days_label')} ({delay.delayPercentage}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{t('bank_guarantee.contractor_label')}: {delay.contractorName}</span>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <strong>{t('bank_guarantee.planned_date_label')}:</strong>{" "}
                            {new Date(delay.plannedEndDate).toLocaleDateString("fr-FR")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>{t('bank_guarantee.milestones_missed_label')}:</strong>{" "}
                            {delay.milestonesMissed}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        {delay.delayPercentage >= DELAY_THRESHOLDS.BANK_NOTIFICATION && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleTriggerBankNotification(delay)}
                            disabled={processing === delay.projectId}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            {processing === delay.projectId ? t('bank_guarantee.notify_sending') : t('bank_guarantee.notify_bank')}
                          </Button>
                        )}

                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to={`/projects/${delay.projectId}`}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t('bank_guarantee.view_project')}
                          </Link>
                        </Button>

                        <ActionsDropdown
                          entityType="bank_guarantee"
                          entityId={delay.projectId}
                          projectId={delay.projectId}
                          contractorId={delay.contractorId}
                          onActionComplete={loadDelays}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {delays.length > 10 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={goToPage}
                  showItemsPerPage={false}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seuils d'escalade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('bank_guarantee.escalation_thresholds_title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
              <div className="font-medium">{t('bank_guarantee.severity_labels.delay_alert')}</div>
              <div className="text-muted-foreground">
                ≥ {DELAY_THRESHOLDS.WARNING}% {t('bank_guarantee.delay_percentage_suffix')}
              </div>
            </div>
            <div className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
              <div className="font-medium">{t('bank_guarantee.severity_labels.bank_notification')}</div>
              <div className="text-muted-foreground">
                ≥ {DELAY_THRESHOLDS.BANK_NOTIFICATION}% {t('bank_guarantee.delay_percentage_suffix')}
              </div>
            </div>
            <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
              <div className="font-medium">{t('bank_guarantee.severity_labels.guarantee_trigger')}</div>
              <div className="text-muted-foreground">
                ≥ {DELAY_THRESHOLDS.GUARANTEE_TRIGGER}% {t('bank_guarantee.delay_percentage_suffix')}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded border-l-4 border-gray-400">
              <div className="font-medium">{t('bank_guarantee.escalation.legal')}</div>
              <div className="text-muted-foreground">
                ≥ {DELAY_THRESHOLDS.LEGAL_ESCALATION}% {t('bank_guarantee.delay_percentage_suffix')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankGuaranteeMonitor;