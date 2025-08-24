import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Users,
  Search,
  Filter,
  Settings,
  TrendingUp,
  CheckCircle,
  Calendar,
  Shield,
  Wrench
} from 'lucide-react';
import RoleBasedNotificationCenter from '@/components/alerts/RoleBasedNotificationCenter';
import NotificationCrud from '@/components/notifications/NotificationCrud';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [inspectionNotifications, setInspectionNotifications] = useState<NotificationData[]>([]);
  const [projectNotifications, setProjectNotifications] = useState<NotificationData[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, unreadCount } = useNotifications();
  const { hasAnyRole } = useCurrentUserRoles();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);

      // Fetch inspection-related notifications
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('notifications')
        .select('*')
        .in('type', ['inspection_scheduled', 'inspection_update', 'inspection_alert'])
        .order('created_at', { ascending: false });

      if (inspectionError) throw inspectionError;

      // Fetch project-related notifications
      const { data: projectData, error: projectError } = await supabase
        .from('notifications')
        .select('*')
        .in('type', ['project_update', 'task_assignment', 'delay_warning'])
        .order('created_at', { ascending: false });

      if (projectError) throw projectError;

      // Fetch system alerts
      const { data: systemData, error: systemError } = await supabase
        .from('notifications')
        .select('*')
        .in('type', ['system_alert', 'security_alert', 'maintenance_alert'])
        .order('created_at', { ascending: false });

      if (systemError) throw systemError;

      setInspectionNotifications(inspectionData || []);
      setProjectNotifications(projectData || []);
      setSystemAlerts(systemData || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        title: "Succès",
        description: "Toutes les notifications ont été marquées comme lues",
      });

      fetchAllNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications comme lues",
        variant: "destructive",
      });
    }
  };

  const getNotificationStats = () => {
    const allNotifications = [
      ...inspectionNotifications,
      ...projectNotifications,
      ...systemAlerts
    ];

    return {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.read).length,
      urgent: allNotifications.filter(n => n.metadata?.priority === 'urgent').length,
      inspections: inspectionNotifications.length,
      projects: projectNotifications.length,
      system: systemAlerts.length
    };
  };

  const stats = getNotificationStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">📬 Centre de Notifications</h1>
                <p className="text-muted-foreground mt-2">
                  Système de notifications centralisé avec gestion des alertes et notifications par rôle
                </p>
              </div>
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
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
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
            <TabsList className="grid w-full grid-cols-6">
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
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.created_at).toLocaleString('fr-FR')}
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
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.created_at).toLocaleString('fr-FR')}
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
                                  {new Date(notification.created_at).toLocaleString('fr-FR')}
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
      </div>
    </div>
  );
};

export default NotificationsCenterPage;