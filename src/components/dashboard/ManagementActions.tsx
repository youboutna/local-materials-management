import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

const ManagementActions: React.FC = () => {
  // Mock data - replace with real data from API
  const actionItems: ActionItem[] = [
    {
      id: '1',
      title: 'Validation Paiement Urgent',
      description: 'Paiement de 150,000 MRO en attente de validation pour le projet Route Nouakchott',
      urgency: 'critical',
      category: 'approval',
      projectId: 'proj-001',
      projectName: 'Route Nouakchott',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2', 
      title: 'Inspection Manquée',
      description: 'Inspection de phase non réalisée depuis 7 jours - risque de retard projet',
      urgency: 'high',
      category: 'task',
      projectId: 'proj-002',
      projectName: 'Pont Kaédi',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Révision Budget',
      description: 'Dépassement budgétaire détecté sur matériaux - révision nécessaire',
      urgency: 'medium',
      category: 'review',
      projectId: 'proj-003',
      projectName: 'École Rosso',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Affectation Équipe',
      description: 'Nouvelle phase démarrée - affecter équipe d\'ingénieurs',
      urgency: 'medium',
      category: 'decision',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }
  ];

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
      case 'approval': return 'Validation';
      case 'task': return 'Tâche';
      case 'review': return 'Révision';
      case 'decision': return 'Décision';
      default: return 'Action';
    }
  };

  const getActionRoute = (item: ActionItem) => {
    switch (item.category) {
      case 'approval':
        if (item.title.includes('Paiement')) return '/payment-control';
        return '/projects';
      case 'task':
        if (item.title.includes('Inspection')) return '/inspection-monitoring';
        return '/projects';
      case 'review':
        return `/projects/${item.projectId}`;
      case 'decision':
        return '/projects';
      default:
        return '/projects';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {actionItems.filter(item => item.urgency === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Nécessitent une attention immédiate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validations Pending</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {actionItems.filter(item => item.category === 'approval').length}
            </div>
            <p className="text-xs text-muted-foreground">En attente de validation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Urgentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {actionItems.filter(item => item.category === 'task' && item.urgency === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">À réaliser rapidement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Décisions Requises</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {actionItems.filter(item => item.category === 'decision').length}
            </div>
            <p className="text-xs text-muted-foreground">Décisions managériales</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Actions Prioritaires
          </CardTitle>
          <CardDescription>
            Actions nécessitant une intervention managériale immédiate
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
                          <strong>Projet:</strong> {item.projectName}
                        </p>
                      )}
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          <strong>Échéance:</strong> {item.dueDate.toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" asChild>
                      <Link to={getActionRoute(item)}>
                        <Send className="h-4 w-4 mr-1" />
                        Traiter
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
            <CardTitle className="text-lg">Contrôle Paiements</CardTitle>
            <CardDescription>Valider et débloquer les paiements</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/payment-control">
                <CheckCircle className="h-4 w-4 mr-2" />
                Accéder au Contrôle
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Surveillance Garanties</CardTitle>
            <CardDescription>Suivre les garanties bancaires</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/bank-guarantee-monitor">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Surveiller Garanties
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suivi Inspections</CardTitle>
            <CardDescription>Monitoring des inspections</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link to="/inspection-monitoring">
                <TrendingUp className="h-4 w-4 mr-2" />
                Suivi Inspections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagementActions;