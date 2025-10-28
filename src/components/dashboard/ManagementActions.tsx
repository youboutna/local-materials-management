import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, Send, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'task' | 'approval' | 'review' | 'decision';
  assignedTo?: string;
  dueDate?: Date;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  paymentId?: string;
}

const ManagementActions: React.FC = () => {
  const { t } = useLanguage();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionItems();
  }, []);

  const fetchActionItems = async () => {
    try {
      const actions: ActionItem[] = [];

      // Fetch pending inspections that require payment validation
      const { data: pendingInspections } = await supabase
        .from('inspections')
        .select(`
          id, date, inspector, progress_at_inspection, project_id, status,
          projects (id, title)
        `)
        .in('status', ['in_progress', 'scheduled'])
        .order('date', { ascending: true })
        .limit(5);

      if (pendingInspections) {
        pendingInspections.forEach(inspection => {
          actions.push({
            id: `inspection-payment-${inspection.id}`,
            title: t('management_actions.validation_payment_inspection'),
            description: `${t('management_actions.inspection_at')} ${inspection.progress_at_inspection}% - ${inspection.inspector}`,
            urgency: inspection.status === 'in_progress' ? 'high' : 'medium',
            category: 'approval',
            projectId: (inspection.projects as any)?.id,
            projectName: (inspection.projects as any)?.title,
            inspectionId: inspection.id,
            dueDate: new Date(inspection.date)
          });
        });
      }

      // Fetch pending payment requests from suppliers
      const { data: paymentRequests } = await supabase
        .from('supplier_payment_requests')
        .select(`
          id, amount, requested_date, project_id, status,
          projects (id, title),
          suppliers (name)
        `)
        .eq('status', 'pending')
        .order('requested_date', { ascending: true })
        .limit(5);

      if (paymentRequests) {
        paymentRequests.forEach(request => {
          actions.push({
            id: `payment-request-${request.id}`,
            title: t('management_actions.payment_request'),
            description: `${t('management_actions.amount')}: ${request.amount.toLocaleString()} MRU - ${(request.suppliers as any)?.name}`,
            urgency: request.amount > 100000 ? 'critical' : 'high',
            category: 'approval',
            projectId: (request.projects as any)?.id,
            projectName: (request.projects as any)?.title,
            paymentId: request.id,
            dueDate: new Date(request.requested_date)
          });
        });
      }

      // Fetch overdue inspections
      const { data: overdueInspections } = await supabase
        .from('inspections')
        .select(`
          id, date, inspector, project_id,
          projects (id, title)
        `)
        .lt('date', new Date().toISOString())
        .eq('status', 'pending')
        .order('date', { ascending: true })
        .limit(3);

      if (overdueInspections) {
        overdueInspections.forEach(inspection => {
          const daysPast = Math.floor((Date.now() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24));
          actions.push({
            id: `inspection-${inspection.id}`,
            title: t('management_actions.missed_inspection'),
            description: `${daysPast} ${t('management_actions.days_overdue')} - ${t('management_actions.inspector')}: ${inspection.inspector}`,
            urgency: daysPast > 7 ? 'high' : 'medium',
            category: 'task',
            projectId: (inspection.projects as any)?.id,
            projectName: (inspection.projects as any)?.title,
            dueDate: new Date(inspection.date)
          });
        });
      }

      // Fetch projects with budget issues (over budget)
      const { data: projectsWithBudgetIssues } = await supabase
        .from('projects')
        .select('id, title, budget, progress')
        .gt('progress', 80)
        .limit(2);

      if (projectsWithBudgetIssues) {
        projectsWithBudgetIssues.forEach(project => {
          actions.push({
            id: `budget-${project.id}`,
            title: t('management_actions.budget_review'),
            description: `${t('management_actions.project_at')} ${project.progress}% - ${t('management_actions.budget_check_needed')}`,
            urgency: 'medium',
            category: 'review',
            projectId: project.id,
            projectName: project.title,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          });
        });
      }

      // Fetch projects needing team assignment (new projects)
      const { data: newProjects } = await supabase
        .from('projects')
        .select('id, title, start_date')
        .eq('progress', 0)
        .gte('start_date', new Date().toISOString())
        .limit(2);

      if (newProjects) {
        newProjects.forEach(project => {
          actions.push({
            id: `team-${project.id}`,
            title: t('management_actions.team_assignment'),
            description: t('management_actions.new_project_starting'),
            urgency: 'medium',
            category: 'decision',
            projectId: project.id,
            projectName: project.title,
            dueDate: new Date(project.start_date)
          });
        });
      }

      setActionItems(actions);
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast({
        title: t('management_actions.error_title'),
        description: t('management_actions.error_loading'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'approval': return CheckCircle;
      case 'task': return Clock;
      case 'review': return FileText;
      case 'decision': return Users;
      default: return AlertTriangle;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'approval': return t('management_actions.category_validation');
      case 'task': return t('management_actions.category_task');
      case 'review': return t('management_actions.category_review');
      case 'decision': return t('management_actions.category_decision');
      default: return t('management_actions.category_action');
    }
  };

  const getActionRoute = (item: ActionItem) => {
    switch (item.category) {
      case 'approval':
        // If it's an inspection payment validation, go to the specific inspection page
        if (item.inspectionId && item.projectId) {
          return `/projects/${item.projectId}?tab=inspections&inspection=${item.inspectionId}`;
        }
        // If it's a payment request, go to payment control page
        if (item.title.includes(t('management_actions.payment_request'))) {
          return '/payment-control';
        }
        // Default payment validation
        if (item.title.includes('Paiement') || item.title.includes('Payment')) return '/payment-control';
        return '/projects';
      case 'task':
        if (item.title.includes(t('management_actions.missed_inspection')) || item.title.includes('Inspection')) return '/inspection-monitoring';
        return '/projects';
      case 'review':
        return `/projects/${item.projectId}`;
      case 'decision':
        return '/projects';
      default:
        return '/projects';
    }
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.critical_actions')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {actionItems.filter(item => item.urgency === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.critical_attention')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.validations_pending')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {actionItems.filter(item => item.category === 'approval').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.pending_validation')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.urgent_tasks')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionItems.filter(item => item.category === 'task' && item.urgency === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.to_do_quickly')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.decisions_required')}</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {actionItems.filter(item => item.category === 'decision').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.managerial_decisions')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('management_actions.priority_actions')}
          </CardTitle>
          <CardDescription>
            {t('management_actions.priority_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionItems.map(item => {
              const IconComponent = getCategoryIcon(item.category);
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge className={`${getUrgencyColor(item.urgency)} text-white text-xs`}>
                          {item.urgency}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                      {item.projectName && (
                        <p className="text-xs text-blue-600">
                          <strong>{t('management_actions.project')}:</strong> {item.projectName}
                        </p>
                      )}
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          <strong>{t('management_actions.deadline')}:</strong> {item.dueDate.toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.inspectionId && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={getActionRoute(item)}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {t('management_actions.link')}
                        </Link>
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link to={getActionRoute(item)}>
                        <Send className="h-4 w-4 mr-1" />
                        {t('management_actions.process')}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.payment_control')}</CardTitle>
            <CardDescription>{t('management_actions.payment_control_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/payment-control">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('management_actions.access_control')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.guarantee_monitoring')}</CardTitle>
            <CardDescription>{t('management_actions.guarantee_monitoring_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/bank-guarantee-monitor">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('management_actions.monitor_guarantees')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.inspection_tracking')}</CardTitle>
            <CardDescription>{t('management_actions.inspection_tracking_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/inspection-monitoring">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('management_actions.track_inspections')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagementActions;