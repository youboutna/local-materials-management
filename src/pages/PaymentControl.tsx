// ============================================================
// src/pages/PaymentControl.tsx
// ============================================================
/**
 * Payment Control Page
 * UI Layer - Contrôle des paiements avec ProjectManager
 * Updated to use AlertService via useProjectManager hook
 */

import { actionLabels } from '@/application/services/ProjectManagerService';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import PaymentControlActions from '@/components/payments/PaymentControlActions';
import PaymentCrud from '@/components/payments/PaymentCrud';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Alert as AlertEntity } from '@/domain/entities/Alert';
import { EscalationRoles } from '@/domain/entities/Hierarchy';
import { ProjectData } from '@/dtos/entities/ProjectAggregateDTO';
import { useNotificationsHex, usePaymentBlocksHex, usePaymentControlHex, useProjectsHex } from '@/hooks/hexagonal';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';
import { useToast } from '@/hooks/use-toast';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    Clock,
    CreditCard,
    ExternalLink,
    Eye
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ============================================================
// Composant des actions de contrôle des paiements
// ============================================================
const PaymentControlActionsContainer = () => {
  const { userId } = useAuthUserHex();
  const { state, alerts, loading } = useProjectManager();
  const { dashboard, blockPayment, approvePayment, rejectPayment } = usePaymentControlHex(userId || 'default-user');

  // Utiliser state ou alerts
  const allAlerts = state?.alerts || alerts || [];

  // Obtenir les raisons de blocage depuis les alertes du ProjectManager
  const getBlockingReasons = useCallback((paymentId: string) => {
    if (!allAlerts.length) return [];
    
    return allAlerts
      .filter((alert: AlertEntity) => alert.severity === 'critical' || alert.severity === 'high')
      .slice(0, 2)
      .map((alert: AlertEntity) => ({
        reason: alert.type,
        description: alert.message || alert.title || 'Alerte',
        severity: alert.severity === 'critical' ? 'blocking' as const : 'warning' as const
      }));
  }, [allAlerts]);

  // Filtrer les paiements en attente
  const pendingPayments = useMemo(() => {
    if (!dashboard?.payments) return [];
    return dashboard.payments.filter((p: any) => !p.resolvedAt).slice(0, 3);
  }, [dashboard?.payments]);

  if (loading) {
    return <div className="text-center py-4">Chargement des paiements...</div>;
  }

  return (
    <div className="space-y-4">
      {pendingPayments.map((payment: any) => (
        <PaymentControlActions
          key={payment.id}
          paymentId={payment.id}
          projectId={payment.projectId}
          contractorId={payment.contractorId || 'unknown'}
          amount={payment.amount || 0}
          blockingReasons={getBlockingReasons(payment.id)}
        />
      ))}
      {pendingPayments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun paiement en attente de validation</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Contenu principal
// ============================================================
const PaymentControlContent = () => {
  const { toast } = useToast();
  const { hasAnyRole } = useCurrentUserRoles();
  const { userId } = useAuthUserHex();
  
  // ✅ Utiliser les hooks hexagonaux
  const { 
    notifications: allNotifications, 
    isLoading, 
    error,
    markAsRead,
    getUnreadCount
  } = useNotificationsHex();
  
  // Récupérer les alertes du ProjectManager
  const { state, alerts, getSummaryStats, loading, runChecks, acknowledgeAlert } = useProjectManager();
  const allAlerts = state?.alerts || alerts || [];
  const stats = getSummaryStats();

  // Filtrer les notifications de paiement
  const paymentNotifications = useMemo(() => {
    return allNotifications
      .filter((n: any) => 
        ['payment_due', 'payment_completed', 'payment_failed', 'payment_pending', 'payment_blocked', 'payment_warning'].includes(n.type)
      )
      .slice(0, 10);
  }, [allNotifications]);

  // Compter les non lues
  const unreadCount = useMemo(() => {
    return paymentNotifications.filter((n: any) => !n.read).length;
  }, [paymentNotifications]);

  // Vérifier les permissions
  const canAccessPaymentControl = hasAnyRole(['admin', 'director', 'manager', 'agent']);

  // Gestion de l'acquittement
  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId, userId || 'current-user', 'Traité depuis le contrôle des paiements');
      await runChecks();
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
    }
  }, [acknowledgeAlert, runChecks, userId]);

  // ============================================================
  // Fonctions utilitaires
  // ============================================================
  const getPaymentStatusIcon = (type: string) => {
    switch (type) {
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
      case 'payment_blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'payment_due':
      case 'payment_warning':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPaymentStatusColor = (type: string) => {
    switch (type) {
      case 'payment_completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_failed':
      case 'payment_blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'payment_due':
      case 'payment_warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // ============================================================
  // Gestion des permissions
  // ============================================================
  if (!canAccessPaymentControl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Accès restreint. Vous n'avez pas les permissions nécessaires pour accéder au contrôle des paiements.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contrôle des Paiements</h1>
                <p className="text-gray-600 mt-2">Gestion et validation des paiements avec notifications en temps réel</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Notifications: {unreadCount}</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  Alertes: {stats.criticalAlerts}
                </Badge>
                <Button variant="outline" onClick={runChecks}>
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
                <p className="text-sm text-muted-foreground">Alertes critiques</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-500">{stats.highAlerts || 0}</div>
                <p className="text-sm text-muted-foreground">Alertes élevées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-500">{stats.openAlerts || 0}</div>
                <p className="text-sm text-muted-foreground">Alertes ouvertes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-500">{stats.totalAlerts}</div>
                <p className="text-sm text-muted-foreground">Total alertes</p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Panel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications de Paiement Récentes
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} nouveau(x)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : paymentNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune notification de paiement récente</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {paymentNotifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${!notification.read ? 'border-l-4 border-l-primary bg-blue-50' : 'bg-white'} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPaymentStatusIcon(notification.type)}
                            <h4 className="font-medium">{notification.title}</h4>
                            {!notification.read && (
                              <Badge variant="secondary">Nouveau</Badge>
                            )}
                            <Badge className={getPaymentStatusColor(notification.type)}>
                              {notification.type.replace('payment_', '').replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          {notification.metadata?.payment_amount && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-green-600">
                                {notification.metadata.payment_amount.toLocaleString('fr-FR')} €
                              </Badge>
                              {notification.metadata?.payment_method && (
                                <Badge variant="outline">{notification.metadata.payment_method}</Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              aria-label={`Marquer la notification "${notification.title}" comme lue`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" aria-label={`Ouvrir le détail de la notification "${notification.title}"`}>
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Control Actions */}
          <PaymentControlActionsContainer />

          {/* Payment Blocking Interface */}
          <EnhancedPaymentBlockingInterface />
          
          {/* Payment CRUD */}
          <div className="mt-8">
            <PaymentCrud />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Page principale avec Provider
// ============================================================
const PaymentControlPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<Array<{id: string, name: string, level: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Utiliser les hooks hexagonaux
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  const { stats: paymentStats } = usePaymentBlocksHex(selectedProject?.id);

  // Helper function
  const toISOStringSafe = useCallback((date: string | Date | undefined | null): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  }, []);

  // ✅ Charger la hiérarchie via RepositoryFactory
  const loadProjectHierarchy = useCallback(async (projectId: string) => {
    try {
      const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
      const hierarchy = await hierarchyRepository.getProjectHierarchy(projectId);
      setProjectHierarchy(hierarchy || []);
    } catch (error) {
      console.warn('[PaymentControlPage] Erreur chargement hiérarchie:', error);
      setProjectHierarchy([]);
    }
  }, []);

  // Sélectionner le projet
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const activeProject = projects.find(p => p.status === 'en cours') || projects[0];
      const projectData = {
        id: activeProject.id,
        title: activeProject.title,
        status: activeProject.status,
        progress: activeProject.progress || 0,
        budget: activeProject.budget || 0,
        startDate: toISOStringSafe(activeProject.startDate),
        endDate: toISOStringSafe(activeProject.endDate),
        teamSize: 0,
        description: activeProject.description || '',
        location: activeProject.location || '',
      } as unknown as ProjectData;
      
      setSelectedProject(projectData);
      loadProjectHierarchy(activeProject.id);
      setIsLoading(false);
    }
  }, [projects, selectedProject, toISOStringSafe, loadProjectHierarchy]);

  // Build dynamic escalation roles
  const buildEscalationRoles = useCallback((): EscalationRoles => {
    if (projectHierarchy.length === 0) {
      return {
        level1: 'employee',
        level2: 'supervisor', 
        level3: 'manager',
        level4: 'director'
      };
    }

    const sortedHierarchy = [...projectHierarchy].sort((a, b) => a.level - b.level);
    const levels = [...new Set(sortedHierarchy.map(h => h.level))].sort();
    
    const roles: EscalationRoles = {
      level1: 'employee',
      level2: 'supervisor',
      level3: 'manager', 
      level4: 'director'
    };

    if (levels.length >= 1) {
      const highestLevel = sortedHierarchy.filter(h => h.level === levels[0]);
      roles.level4 = highestLevel[0]?.position_title || 'director';
    }
    
    if (levels.length >= 2) {
      const secondLevel = sortedHierarchy.filter(h => h.level === levels[1]);
      roles.level3 = secondLevel[0]?.position_title || 'manager';
    }
    
    if (levels.length >= 3) {
      const thirdLevel = sortedHierarchy.filter(h => h.level === levels[2]);
      roles.level2 = thirdLevel[0]?.position_title || 'supervisor';
    }

    return roles;
  }, [projectHierarchy]);

  // États de chargement
  if (isLoading || projectsLoading || !selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  // Render avec Provider
  return (
    <ProjectManagerProvider 
      project={selectedProject} 
      roles={buildEscalationRoles()} 
      actionLabels={actionLabels}
    >
      <PaymentControlContent />
    </ProjectManagerProvider>
  );
};

export default PaymentControlPage;