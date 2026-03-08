import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Eye, EyeOff, Clock, AlertTriangle, DollarSign, FileText, Users } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { getNotificationLink } from '@/utils/notificationUtils';
import { NotificationType } from '@/dtos/entities/NotificationTypeDTO';

const RoleBasedNotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { userRoles, hasRole } = useCurrentUserRoles();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    const link = getNotificationLink(
      notification.type as NotificationType,
      notification.metadata || {},
      notification.related_id
    );
    navigate(link);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bank_guarantee_trigger':
      case 'contractor_penalty':
        return <DollarSign className="h-4 w-4" />;
      case 'inspection_required':
      case 'inspection_overdue':
        return <Eye className="h-4 w-4" />;
      case 'delay_warning':
      case 'escalation_required':
        return <AlertTriangle className="h-4 w-4" />;
      case 'compliance_alert':
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationPriority = (notification: any) => {
    if (notification.metadata?.priority === 'urgent') return 'urgent';
    if (notification.metadata?.priority === 'high') return 'high';
    if (notification.metadata?.priority === 'medium') return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleSpecificNotifications = () => {
    if (!notifications) return [];

    return notifications.filter((notification: any) => {
      // Role-based filtering
      const type = notification.type as NotificationType;
      
      if (hasRole('director')) {
        // Directors see everything, especially critical items
        return ['bank_guarantee_trigger', 'escalation_required', 'compliance_alert'].includes(type) || 
               notification.metadata?.escalation_level >= 2;
      }
      
      if (hasRole('director_programming')) {
        // Programming directors see project-related delays and escalations
        return ['delay_warning', 'bank_guarantee_trigger', 'project_update', 'escalation_required'].includes(type);
      }
      
      if (hasRole('project_manager')) {
        // Project managers see all project-related notifications
        return ['task_assignment', 'project_update', 'inspection_required', 'delay_warning'].includes(type);
      }
      
      if (hasRole('engineering_consultant')) {
        // Consultants see inspection and compliance items
        return ['inspection_required', 'compliance_alert', 'inspection_overdue'].includes(type);
      }
      
      if (hasRole('contractor')) {
        // Contractors see penalties and task assignments
        return ['contractor_penalty', 'task_assignment', 'project_update'].includes(type);
      }
      
      return true; // Default: show all
    });
  };

  const filteredNotifications = getRoleSpecificNotifications().filter((notification: any) => {
    if (selectedFilter === 'all') return true;
    return notification.type === selectedFilter;
  });

  const notificationCounts = {
    urgent: filteredNotifications.filter((n: any) => getNotificationPriority(n) === 'urgent').length,
    bank_guarantee: notifications?.filter((n: any) => n.type === 'bank_guarantee_trigger').length || 0,
    inspections: notifications?.filter((n: any) => n.type === 'inspection_required' || n.type === 'inspection_overdue').length || 0,
    compliance: notifications?.filter((n: any) => n.type === 'compliance_alert').length || 0
  };

  if (isLoading) {
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

  return (
    <div className="space-y-4">
      {/* Role-based summary for directors/managers */}
      {(hasRole('director') || hasRole('director_programming')) && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Tableau de Bord Exécutif
              </span>
              <div className="flex gap-2">
                <Badge variant="destructive">{notificationCounts.urgent} Urgent</Badge>
                <Badge variant="outline">{unreadCount} Non lus</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{notificationCounts.bank_guarantee}</div>
                <div className="text-sm text-muted-foreground">Garanties Bancaires</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{notificationCounts.inspections}</div>
                <div className="text-sm text-muted-foreground">Inspections</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{notificationCounts.compliance}</div>
                <div className="text-sm text-muted-foreground">Conformité</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Centre de Notifications
              {hasRole('director') && <Badge variant="outline">Vue Directeur</Badge>}
              {hasRole('project_manager') && <Badge variant="outline">Chef de Projet</Badge>}
              {hasRole('engineering_consultant') && <Badge variant="outline">Consultant</Badge>}
            </span>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <EyeOff className="h-4 w-4 mr-2" />
              Tout marquer lu
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              Toutes ({filteredNotifications.length})
            </Button>
            <Button
              variant={selectedFilter === 'bank_guarantee_trigger' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('bank_guarantee_trigger')}
            >
              Garanties Bancaires
            </Button>
            <Button
              variant={selectedFilter === 'inspection_required' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('inspection_required')}
            >
              Inspections
            </Button>
            <Button
              variant={selectedFilter === 'compliance_alert' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('compliance_alert')}
            >
              Conformité
            </Button>
          </div>

          {filteredNotifications.length === 0 ? (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Aucune notification pour votre rôle actuellement.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.slice(0, 10).map((notification: any) => {
                const priority = getNotificationPriority(notification);
                return (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-colors hover:shadow-md ${
                      !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-full bg-muted">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              <Badge variant={getPriorityColor(priority)}>
                                {priority.toUpperCase()}
                              </Badge>
                              {notification.metadata?.escalation_level && (
                                <Badge variant="destructive">
                                  Niveau {notification.metadata.escalation_level}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            
                            {/* Metadata display for key info */}
                            {notification.metadata && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {notification.metadata.delay_percentage && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                    Retard: {notification.metadata.delay_percentage}%
                                  </span>
                                )}
                                {notification.metadata.contract_guarantee_amount && (
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                    Garantie: {notification.metadata.contract_guarantee_amount.toLocaleString()} MRU
                                  </span>
                                )}
                                {notification.metadata.contractor_name && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {notification.metadata.contractor_name}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleBasedNotificationCenter;
