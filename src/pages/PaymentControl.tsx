// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import PaymentCrud from '@/components/payments/PaymentCrud';
import PaymentControlActions from '@/components/payments/PaymentControlActions';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/use-toast';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/application/services/ProjectManagerService';
import { EscalationRoles } from '@/domain/entities/Hierarchy';
import { ProjectData } from '@/dtos/entities/ProjectAggregateDTO';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useProjectsHex, usePaymentControlHex, useNotificationsHex, usePaymentBlocksHex } from '@/hooks/hexagonal';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

// Component to render payment control actions with real data
const PaymentControlActionsContainer = () => {
  const { userId } = useAuthUserHex();
  const { data } = useProjectManager();
  const { dashboard, blockPayment, approvePayment, rejectPayment } = usePaymentControlHex(userId || 'default-user');

  // Get blocking reasons from project manager alerts
  const getBlockingReasons = (paymentId: string) => {
    if (!data?.alerts) return [];
    
    return data.alerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .slice(0, 2)
      .map(alert => ({
        reason: alert.type,
        description: alert.message,
        severity: alert.severity === 'critical' ? 'blocking' as const : 'warning' as const
      }));
  };

  return (
    <div className="space-y-4">
        {dashboard?.payments.filter(p => !p.resolvedAt).slice(0, 3).map((payment) => (
          <PaymentControlActions
            key={payment.id}
            paymentId={payment.id}
            projectId={payment.projectId}
            contractorId={payment.contractorId || 'unknown'}
            amount={payment.amount || 0}
            blockingReasons={getBlockingReasons(payment.id)}
          />
        ))}
        {(!dashboard || dashboard.payments.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun paiement en attente de validation</p>
          </div>
        )}
    </div>
  );
};

// Main content component
const PaymentControlContent = () => {
  const { toast } = useToast();
  const { hasAnyRole } = useCurrentUserRoles();
  
  // Use hexagonal notifications hook instead of direct Supabase calls
  const { 
    notifications: allNotifications, 
    isLoading, 
    error,
    markAsRead,
    getUnreadCount
  } = useNotificationsHex();
  
  // Get unread count
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };
    fetchUnreadCount();
  }, [allNotifications, getUnreadCount]);
  
  // Filter payment notifications
  const paymentNotifications = allNotifications.filter(n => 
    ['payment_due', 'payment_completed', 'payment_failed', 'payment_pending', 'payment_blocked', 'payment_warning'].includes(n.type)
  ).slice(0, 10);

  // Check if user has permission to access payment control
  const canAccessPaymentControl = hasAnyRole(['admin', 'director', 'manager', 'agent']);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header with notifications summary */}
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
              </div>
            </div>
          </div>

          {/* Payment Notifications Panel */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications de Paiement Récentes
                {paymentNotifications.filter(n => !n.read).length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {paymentNotifications.filter(n => !n.read).length} nouveau(x)
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
                  {paymentNotifications.map((notification) => (
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

          {/* Payment Control Actions - Using real data from database */}
          <PaymentControlActionsContainer />

          {/* Payment Control Interface */}
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

// Main component with ProjectManager provider
const PaymentControlPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<Array<{id: string, name: string, level: number}>>([]);
  
  // Use hexagonal hooks
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  // Conformité : passe l'id du projet sélectionné (sinon le hook log
  // "No projectId provided" et `stats` reste vide).
  const { stats: paymentStats } = usePaymentBlocksHex(selectedProject?.id);

  // Helper function to safely convert date to ISO string
  const toISOStringSafe = (date: string | Date | undefined | null): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  useEffect(() => {
    // Select first active project when projects are loaded
    if (projects.length > 0 && !selectedProject) {
      const activeProject = projects.find(p => p.status === 'en cours') || projects[0];
      const projectData = {
        id: activeProject.id,
        title: activeProject.title,
        status: activeProject.status,
        progress: activeProject.progress,
        budget: activeProject.budget,
        startDate: toISOStringSafe(activeProject.startDate),
        endDate: toISOStringSafe(activeProject.endDate),
        teamSize: 0,
        description: activeProject.description,
        location: activeProject.location,
      } as unknown as ProjectData;
      
      setSelectedProject(projectData);
      
      // Load organizational hierarchy for this project (still needs supabase for RPC)
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase
          .rpc('get_project_hierarchy', { project_id_param: activeProject.id })
          .then(({ data: hierarchy }) => {
            setProjectHierarchy(hierarchy || []);
          });
      });
    }
  }, [projects, selectedProject]);

  // Build dynamic escalation roles from project hierarchy
  const buildEscalationRoles = (): EscalationRoles => {
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

    // Map actual hierarchy positions to escalation levels
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
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet et de l'organisation...</p>
        </div>
      </div>
    );
  }

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