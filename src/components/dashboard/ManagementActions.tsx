import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, Send, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useManagementActionsHex, ActionItem } from '@/hooks/hexagonal';

const ManagementActions: React.FC = () => {
  const { t } = useLanguage();
  const { actions: actionItems, loading } = useManagementActionsHex();

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
      case 'approval': return t('management_actions.category_validation') || 'Validation';
      case 'task': return t('management_actions.category_task') || 'Tâche';
      case 'review': return t('management_actions.category_review') || 'Revue';
      case 'decision': return t('management_actions.category_decision') || 'Décision';
      default: return t('management_actions.category_action') || 'Action';
    }
  };

  const getActionRoute = (item: ActionItem) => {
    switch (item.category) {
      case 'approval':
        if (item.inspectionId && item.projectId) {
          return `/projects/${item.projectId}?tab=inspections&inspection=${item.inspectionId}`;
        }
        if (item.title.includes('paiement') || item.title.includes('Paiement')) return '/payment-control';
        return '/projects';
      case 'task':
        if (item.title.includes('Inspection') || item.title.includes('inspection')) return '/inspection-monitoring';
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
            <CardTitle className="text-sm font-medium">{t('management_actions.critical_actions') || 'Actions critiques'}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {actionItems.filter(item => item.urgency === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.critical_attention') || 'Attention immédiate requise'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.validations_pending') || 'Validations en attente'}</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {actionItems.filter(item => item.category === 'approval').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.pending_validation') || 'En attente de validation'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.urgent_tasks') || 'Tâches urgentes'}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionItems.filter(item => item.category === 'task' && item.urgency === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.to_do_quickly') || 'À faire rapidement'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('management_actions.decisions_required') || 'Décisions requises'}</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {actionItems.filter(item => item.category === 'decision').length}
            </div>
            <p className="text-xs text-muted-foreground">{t('management_actions.managerial_decisions') || 'Décisions managériales'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('management_actions.priority_actions') || 'Actions Prioritaires'}
          </CardTitle>
          <CardDescription>
            {t('management_actions.priority_description') || 'Actions nécessitant votre attention immédiate'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Aucune action en attente</p>
              </div>
            ) : (
              actionItems.map(item => {
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
                            <strong>{t('management_actions.project') || 'Projet'}:</strong> {item.projectName}
                          </p>
                        )}
                        {item.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            <strong>{t('management_actions.deadline') || 'Échéance'}:</strong> {item.dueDate.toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.inspectionId && (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={getActionRoute(item)}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t('management_actions.link') || 'Lien'}
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link to={getActionRoute(item)}>
                          <Send className="h-4 w-4 mr-1" />
                          {t('management_actions.process') || 'Traiter'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.payment_control') || 'Contrôle des Paiements'}</CardTitle>
            <CardDescription>{t('management_actions.payment_control_desc') || 'Gérer les validations de paiement'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/payment-control">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('management_actions.access_control') || 'Accéder au contrôle'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.guarantee_monitoring') || 'Suivi des Garanties'}</CardTitle>
            <CardDescription>{t('management_actions.guarantee_monitoring_desc') || 'Surveiller les garanties bancaires'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/bank-guarantee-monitor">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t('management_actions.monitor_guarantees') || 'Surveiller les garanties'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('management_actions.inspection_tracking') || 'Suivi des Inspections'}</CardTitle>
            <CardDescription>{t('management_actions.inspection_tracking_desc') || 'Suivre les inspections planifiées'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/inspection-monitoring">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('management_actions.track_inspections') || 'Suivre les inspections'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagementActions;
