import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  CreditCard, 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import PaymentCrud from '@/components/payments/PaymentCrud';
import PaymentControlActions from '@/components/payments/PaymentControlActions';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/services/ProjectManagerService';
import { EscalationRoles, ProjectData } from '@/types/project';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: any;
}

// Component to render payment control actions with real data
const PaymentControlActionsContainer = () => {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const { data } = useProjectManager();

  useEffect(() => {
    const loadPendingPayments = async () => {
      try {
        const { data: payments } = await supabase
          .from('payment_blocks')
          .select(`
            *,
            projects(title, responsible_id),
            profiles(display_name)
          `)
          .is('resolved_at', null)
          .limit(3);

        setPendingPayments(payments || []);
      } catch (error) {
        console.error('Error loading pending payments:', error);
      }
    };

    loadPendingPayments();
  }, []);

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
      {pendingPayments.map((payment) => (
        <PaymentControlActions
          key={payment.id}
          paymentId={payment.id}
          projectId={payment.project_id}
          contractorId={payment.contractor_id || 'unknown'}
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

// Main content component
const PaymentControlContent = () => {
  const [paymentNotifications, setPaymentNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { unreadCount } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentNotifications();
    // Set up real-time listener for payment notifications
    const channel = supabase
      .channel('payment-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: 'type=in.(payment_due,payment_completed,payment_failed,payment_pending,payment_blocked,payment_warning)',
        },
        () => {
          fetchPaymentNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPaymentNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('type', ['payment_due', 'payment_completed', 'payment_failed', 'payment_pending', 'payment_blocked', 'payment_warning'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPaymentNotifications(data || []);
    } catch (error) {
      console.error('Error fetching payment notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications de paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setPaymentNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

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
              {loading ? (
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
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
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

  useEffect(() => {
    // Load a default project for monitoring
    const loadDefaultProject = async () => {
      try {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'en cours')
          .limit(1);
        
        if (projects && projects.length > 0) {
          const project = projects[0];
          setSelectedProject({
            ...project,
            startDate: project.start_date || new Date().toISOString(),
            teamSize: project.team_size || 0
          } as ProjectData);
        }
      } catch (error) {
        console.error('Error loading default project:', error);
      }
    };

    loadDefaultProject();
  }, []);

  const defaultRoles: EscalationRoles = {
    manager: 'chef_projet',
    director: 'directeur',
    siteEngineer: 'chef_chantier',
    admin: 'admin'
  };

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet de monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectManagerProvider 
      project={selectedProject} 
      roles={defaultRoles} 
      actionLabels={actionLabels}
    >
      <PaymentControlContent />
    </ProjectManagerProvider>
  );
};

export default PaymentControlPage;