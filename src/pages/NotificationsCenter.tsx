import RoleBasedNotificationCenter from '@/components/alerts/RoleBasedNotificationCenter';
import NotificationCrud from '@/components/notifications/NotificationCrud';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useNotificationsHex } from '@/hooks/hexagonal';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import {
    AlertTriangle,
    Bell,
    Calendar,
    CheckCircle,
    CheckSquare,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    ExternalLink,
    Eye,
    EyeOff,
    FileText,
    Filter,
    PlayCircle,
    Search,
    Send,
    Settings,
    Share,
    Shield,
    TrendingUp,
    Upload,
    Users,
    Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  recipient_id: string;
  related_id: string | null;
  metadata: any;
}

const NotificationsCenterPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const { hasAnyRole } = useCurrentUserRoles();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch current user ID for notifications
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    };
    fetchUser();
  }, []);

  // Use hexagonal hooks for different notification types
  const inspectionTypes = ['inspection_required', 'inspection_overdue'];
  const projectTypes = ['project_update', 'project_created', 'project_completed', 'project_milestone', 'delay_warning'];
  const paymentTypes = ['payment_due', 'payment_completed', 'payment_failed', 'payment_pending', 'payment_blocked', 'payment_warning'];
  const taskTypes = ['task_assignment', 'task_completed', 'task_overdue'];
  const documentTypes = ['document_review', 'document_shared', 'document_approved', 'document_rejected', 'document_uploaded'];
  const systemTypes = ['system', 'bank_guarantee_trigger', 'contractor_penalty', 'compliance_alert', 'escalation_required', 'insurance_expiry', 'insurance_update'];

  const { 
    notifications: inspectionNotifications, 
    loading: inspectionsLoading,
    refetch: refetchInspections 
  } = useNotificationsHex(undefined, inspectionTypes);
  
  const { 
    notifications: projectNotifications,
    refetch: refetchProjects 
  } = useNotificationsHex(undefined, projectTypes);
  
  const { 
    notifications: paymentNotifications,
    refetch: refetchPayments 
  } = useNotificationsHex(undefined, paymentTypes);
  
  const { 
    notifications: taskNotifications,
    refetch: refetchTasks 
  } = useNotificationsHex(undefined, taskTypes);
  
  const { 
    notifications: documentNotifications,
    refetch: refetchDocuments 
  } = useNotificationsHex(undefined, documentTypes);
  
  const { 
    notifications: systemAlerts,
    refetch: refetchSystem,
    markAllAsRead: markAllSystemAsRead 
  } = useNotificationsHex(currentUserId, systemTypes);

  const loading = inspectionsLoading;

  const fetchAllNotifications = () => {
    refetchInspections();
    refetchProjects();
    refetchPayments();
    refetchTasks();
    refetchDocuments();
    refetchSystem();
  };

  // Set up real-time listener
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchAllNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const markAllAsRead = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user.data.user.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: "Toutes les notifications ont été marquées comme lues",
      });

      fetchAllNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: t('common.error'),
        description: "Impossible de marquer les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  const getNotificationStats = () => {
    const allNotifications = [
      ...inspectionNotifications,
      ...projectNotifications,
      ...paymentNotifications,
      ...taskNotifications,
      ...documentNotifications,
      ...systemAlerts
    ];

    return {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.read).length,
      urgent: allNotifications.filter(n => n.metadata?.priority === 'urgent').length,
      inspections: inspectionNotifications.length,
      projects: projectNotifications.length,
      payments: paymentNotifications.length,
      tasks: taskNotifications.length,
      documents: documentNotifications.length,
      system: systemAlerts.length
    };
  };

  const stats = getNotificationStats();

  return (
    <AppLayout
      pageTitle="📬 Centre de Notifications"
      pageDescription="Système de notifications centralisé avec gestion des alertes et notifications par rôle"
      actions={
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {stats.unread} non lues
          </Badge>
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marquer tout lu
          </Button>
          <Button variant="outline" onClick={fetchAllNotifications}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      }
    >
      <div className="space-y-6">

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Non lues</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                  </div>
                  <EyeOff className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Urgentes</p>
                    <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inspections</p>
                    <p className="text-2xl font-bold text-green-600">{stats.inspections}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Projets</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.projects}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paiements</p>
                    <p className="text-2xl font-bold text-green-600">{stats.payments}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tâches</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.tasks}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.documents}</p>
                  </div>
                  <Share className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Système</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.system}</p>
                  </div>
                  <Settings className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher dans les notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Interface */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Toutes
              </TabsTrigger>
              <TabsTrigger value="role-based" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Par Rôle
              </TabsTrigger>
              <TabsTrigger value="inspections" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Inspections
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Projets
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paiements
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tâches
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Système
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Gestion
              </TabsTrigger>
            </TabsList>

            {/* All Notifications */}
            <TabsContent value="all" className="mt-6">
              <RoleBasedNotificationCenter />
            </TabsContent>

            {/* Role-based Notifications */}
            <TabsContent value="role-based" className="mt-6">
              <Alert className="mb-6">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Notifications filtrées selon votre rôle et vos responsabilités dans le système
                </AlertDescription>
              </Alert>
              <RoleBasedNotificationCenter />
            </TabsContent>

            {/* Inspection Notifications */}
            <TabsContent value="inspections" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Notifications d'Inspection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : inspectionNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune notification d'inspection</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inspectionNotifications
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                {notification.metadata?.documents && notification.metadata.documents.length > 0 && (
                                  <div className="mb-2 space-y-1">
                                    {notification.metadata.documents.slice(0, 3).map((d: any, i: number) => (
                                      <a
                                        key={i}
                                        href={d.file_url || d.fileUrl || d.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline block"
                                      >
                                        {d.file_name || d.name || `Document ${i + 1}`}
                                      </a>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project Notifications */}
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notifications de Projet
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Démarrer Projet
                    </Button>
                     <Button variant="outline" size="sm" asChild>
                       <Link to="/projects" className="flex items-center">
                         <ExternalLink className="h-4 w-4 mr-2" />
                         Voir Projet
                       </Link>
                     </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Planifier Étape
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : projectNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune notification de projet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectNotifications
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                  {notification.metadata?.project_phase && (
                                    <Badge variant="outline">{notification.metadata.project_phase}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                  {notification.metadata?.documents && notification.metadata.documents.length > 0 && (
                                    <div className="mb-2 space-y-1">
                                      {notification.metadata.documents.slice(0, 3).map((d: any, i: number) => (
                                        <a
                                          key={i}
                                          href={d.file_url || d.fileUrl || d.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-blue-600 hover:underline block"
                                        >
                                          {d.file_name || d.name || `Document ${i + 1}`}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                {notification.metadata?.completion_percentage && (
                                  <div className="mb-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span>Progression</span>
                                      <span>{notification.metadata.completion_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{ width: `${notification.metadata.completion_percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Notifications */}
            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Notifications de Paiement
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Traiter Paiement
                    </Button>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : paymentNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune notification de paiement</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentNotifications
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                  {notification.type.includes('completed') && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>
                                  )}
                                  {notification.type.includes('failed') && (
                                    <Badge variant="destructive">Échec</Badge>
                                  )}
                                  {notification.type.includes('blocked') && (
                                    <Badge variant="destructive">Bloqué</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                  {notification.metadata?.documents && notification.metadata.documents.length > 0 && (
                                    <div className="mb-2 space-y-1">
                                      {notification.metadata.documents.slice(0, 3).map((d: any, i: number) => (
                                        <a
                                          key={i}
                                          href={d.file_url || d.fileUrl || d.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-blue-600 hover:underline block"
                                        >
                                          {d.file_name || d.name || `Document ${i + 1}`}
                                        </a>
                                      ))}
                                    </div>
                                  )}
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
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Task Notifications */}
            <TabsContent value="tasks" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Notifications de Tâches
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marquer Terminé
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Assigner
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Échéance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : taskNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune notification de tâche</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {taskNotifications
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                  {notification.type.includes('completed') && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>
                                  )}
                                  {notification.type.includes('overdue') && (
                                    <Badge variant="destructive">En retard</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                  {notification.metadata?.documents && notification.metadata.documents.length > 0 && (
                                    <div className="mb-2 space-y-1">
                                      {notification.metadata.documents.slice(0, 3).map((d: any, i: number) => (
                                        <a
                                          key={i}
                                          href={d.file_url || d.fileUrl || d.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs text-blue-600 hover:underline block"
                                        >
                                          {d.file_name || d.name || `Document ${i + 1}`}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                {notification.metadata?.assignee_name && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      Assigné à: {notification.metadata.assignee_name}
                                    </Badge>
                                  </div>
                                )}
                                {notification.metadata?.due_date && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-orange-600">
                                      Échéance: {new Date(notification.metadata.due_date).toLocaleDateString('fr-FR')}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document Notifications */}
            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share className="h-5 w-5" />
                    Notifications de Documents
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Téléverser
                    </Button>
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : documentNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune notification de document</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documentNotifications
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                  {notification.type.includes('approved') && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">Approuvé</Badge>
                                  )}
                                  {notification.type.includes('rejected') && (
                                    <Badge variant="destructive">Rejeté</Badge>
                                  )}
                                  {notification.type.includes('shared') && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600">Partagé</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                {notification.metadata?.document_name && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      📄 {notification.metadata.document_name}
                                    </Badge>
                                    {notification.metadata?.document_type && (
                                      <Badge variant="outline">{notification.metadata.document_type}</Badge>
                                    )}
                                  </div>
                                )}
                                {notification.metadata?.shared_with && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-blue-600">
                                      Partagé avec: {notification.metadata.shared_with.join(', ')}
                                    </Badge>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Alerts */}
            <TabsContent value="system" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Alertes Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : systemAlerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune alerte système</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {systemAlerts
                        .filter(notification => 
                          searchTerm === '' || 
                          notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((notification) => (
                        <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{notification.title}</h4>
                                  {!notification.read && <Badge variant="secondary">Nouveau</Badge>}
                                  {notification.metadata?.priority === 'urgent' && (
                                    <Badge variant="destructive">Urgent</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management */}
            <TabsContent value="management" className="mt-6">
              <Alert className="mb-6">
                <Wrench className="h-4 w-4" />
                <AlertDescription>
                  Interface de gestion pour créer et configurer les notifications système
                </AlertDescription>
              </Alert>
              <NotificationCrud />
            </TabsContent>
          </Tabs>
        </div>
    </AppLayout>
  );
};

export default NotificationsCenterPage;