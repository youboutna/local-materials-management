import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Eye, 
  FileText, 
  Bell, 
  BarChart3, 
  Package, 
  Shield, 
  Users 
} from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/application/services/ProjectManagerService';
import { EscalationRoles, ProjectData } from '@/types/project';
import { AppLayout } from '@/components/layout';
import { useProjectsHex, useDocumentsHex } from '@/hooks/hexagonal';

interface ProjectAlert {
  id: string;
  title: string;
  delay: number;
  status: 'crisis' | 'warning' | 'normal';
  action?: string;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface Document {
  id: string;
  title: string;
  sharedBy: string;
  date: string;
  type: 'plan' | 'report' | 'certificate';
}

interface Alert {
  id: string;
  message: string;
  type: 'insurance_expiry' | 'bank_guarantee' | 'inspection_overdue' | 'payment_blocked' | 'compliance_violation' | 'delivery' | 'deadline' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: 'insurance' | 'bank_guarantee' | 'inspection' | 'payment' | 'notification';
  data?: any;
}

// Dashboard Content Component that uses ProjectManager
const DashboardContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, runChecks } = useProjectManager();
  
  const [projectAlerts, setProjectAlerts] = useState<ProjectAlert[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeChantiers, setActiveChantiers] = useState(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  // Convert ProjectManager alerts to dashboard format
  const alerts: Alert[] = data?.alerts?.map(alert => ({
    id: alert.id,
    message: alert.message,
    type: alert.type as Alert['type'],
    severity: alert.severity,
    source: alert.source as Alert['source'],
    data: alert
  })) || [];

  // Use hexagonal hooks for data
  const { projects: hexProjects } = useProjectsHex();
  const { documents: hexDocuments } = useDocumentsHex();

  // Load real data and run project checks
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingAlerts(true);
        
        // Run project manager checks to get comprehensive alerts
        await runChecks();
        
        // Use hexagonal projects data
        const activeProjectsCount = hexProjects.filter(p => p.status === 'en cours').length;
        setActiveChantiers(activeProjectsCount);

        // Map documents from hexagonal hook
        if (hexDocuments.length > 0) {
          setDocuments(hexDocuments.slice(0, 3).map(d => ({
            id: d.id,
            title: d.title || 'Document sans titre',
            sharedBy: 'Chef Projet',
            date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '',
            type: 'plan' as const
          })));
        }

        // Generate project alerts from data
        if (data?.alerts) {
          const criticalProjectAlerts = data.alerts
            .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
            .slice(0, 3)
            .map(alert => ({
              id: alert.id,
              title: alert.title || 'Projet inconnu',
              delay: 0,
              status: alert.severity === 'critical' ? 'crisis' as const : 'warning' as const,
              action: alert.message
            }));
          setProjectAlerts(criticalProjectAlerts);
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAlerts(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, toast, runChecks, data, hexProjects, hexDocuments]);

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        {/* Portal Header */}
        <div className="bg-primary text-primary-foreground p-4 border-b">
          <div className="flex items-center gap-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">📊 Tableau de bord</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span className="font-semibold">📦 Portail Fournisseur</span>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Crisis Projects Alert */}
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                📌 Projets en crise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="text-red-700">
                    <strong>{alert.title}:</strong> Retard {alert.delay}j 
                    {alert.action && <span className="ml-2">({alert.action})</span>}
                  </div>
                  <Badge variant="destructive">Critique</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* This Week Milestones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                📅 Jalons cette semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3">
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className={`${
                      milestone.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {milestone.status === 'completed' ? '[✔️]' : '[🟡]'} {milestone.title} ({milestone.date})
                    </span>
                    {milestone.status === 'completed' && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Terminé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                🗺️ Carte des Chantiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 p-6 rounded-lg text-center">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">{activeChantiers}</div>
                  <div className="text-sm text-muted-foreground">chantiers actifs</div>
                </div>
                {data?.progress !== undefined && (
                  <div className="mb-4">
                    <div className="text-lg font-semibold text-green-600">{Math.round(data.progress)}%</div>
                    <div className="text-xs text-muted-foreground">progression moyenne</div>
                  </div>
                )}
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Voir {activeChantiers} chantiers actifs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Portal Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📂 Derniers documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900">{doc.title}</div>
                      <div className="text-sm text-blue-700 mt-1">
                        Partagé par {doc.sharedBy} le {doc.date}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="font-medium text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      ❗ Action requise:
                    </div>
                    <div className="text-sm text-orange-700 mt-1">
                      Confirmer livraison acier avant 20/08
                    </div>
                    <Button size="sm" className="mt-2" variant="outline">
                      Confirmer maintenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  📬 Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary rounded-full"></div>
                    <p className="text-sm text-muted-foreground mt-2">Chargement des alertes...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune alerte active</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'high' ? 'bg-yellow-50 border-yellow-200' :
                        alert.severity === 'medium' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className={`flex-1 ${
                            alert.severity === 'critical' ? 'text-red-800' :
                            alert.severity === 'high' ? 'text-yellow-800' :
                            alert.severity === 'medium' ? 'text-blue-800' :
                            'text-gray-800'
                          }`}>
                            <div className="font-medium mb-1">
                              {alert.type === 'insurance_expiry' && '🛡️ Assurance'} 
                              {alert.type === 'bank_guarantee' && '🏦 Garantie'} 
                              {alert.type === 'inspection_overdue' && '🔍 Inspection'} 
                              {alert.type === 'payment_blocked' && '💰 Paiement'} 
                              {alert.type === 'compliance_violation' && '⚠️ Conformité'}
                              {!['insurance_expiry', 'bank_guarantee', 'inspection_overdue', 'payment_blocked', 'compliance_violation'].includes(alert.type) && '📋 Alerte'}
                            </div>
                            <div className="text-sm">
                              {alert.message}
                            </div>
                          </div>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'default' :
                            'secondary'
                          }>
                            {alert.severity === 'critical' ? 'Critique' :
                             alert.severity === 'high' ? 'Élevé' :
                             alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {alerts.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm">
                          Voir toutes les alertes ({alerts.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Monitoring Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enhanced Monitoring & Inspection by Engineering Consultant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                🔹 Objective: Strengthen oversight with digital tools, real-time reporting, and accountability.
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Implementation Steps:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <strong className="text-green-800">✅ Digital Inspection Checklists</strong>
                    </div>
                    <p className="text-sm text-green-700">
                      Mobile-friendly forms for engineers to log daily inspections (photos, notes, defects).
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Mandatory fields to ensure critical checks aren't skipped.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <strong className="text-blue-800">✅ Real-Time Progress Dashboards</strong>
                    </div>
                    <p className="text-sm text-blue-700">
                      GPS-tagged reports showing inspection locations (linked to geolocation module).
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      AI-driven anomaly detection (e.g., deviations from blueprints, material mismatches).
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <strong className="text-purple-800">✅ Delegation & Accountability</strong>
                    </div>
                    <p className="text-sm text-purple-700">
                      Role-based access: Consultants submit reports, but only the Company/Director can approve critical changes.
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Audit trails tracking who inspected, approved, or modified plans.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <strong className="text-orange-800">✅ Automated Compliance Alerts</strong>
                    </div>
                    <p className="text-sm text-orange-700">
                      If inspections are missed, notify the consultant's supervisor.
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Flag recurring issues (e.g., safety violations) for priority resolution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
};

// Main component with ProjectManager provider
const EnhancedDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<any[]>([]);
  
  // Use hexagonal hook for projects
  const { projects: hexProjects } = useProjectsHex();

  useEffect(() => {
    // Load a default project for monitoring with its hierarchy using hexagonal data
    const loadDefaultProject = async () => {
      try {
        const activeProjects = hexProjects.filter(p => p.status === 'en cours');
        
        if (activeProjects.length > 0) {
          const project = activeProjects[0];
          const projectData = {
            id: project.id,
            title: project.title,
            status: project.status,
            progress: project.progress,
            budget: project.budget,
            startDate: project.startDate?.toISOString() || new Date().toISOString(),
            teamSize: project.teamSize || 0,
            description: project.description,
            location: project.location,
          } as ProjectData;
          
          setSelectedProject(projectData);

          // Load organizational hierarchy for this project (RPC still needs dynamic import)
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: hierarchy } = await supabase
            .rpc('get_project_hierarchy', { project_id_param: project.id });
          
          setProjectHierarchy(hierarchy || []);
        }
      } catch (error) {
        console.error('Error loading default project:', error);
      }
    };

    if (hexProjects.length > 0) {
      loadDefaultProject();
    }
  }, [hexProjects]);

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

  const defaultRoles = buildEscalationRoles();

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
      <DashboardContent />
    </ProjectManagerProvider>
  );
};

export default EnhancedDashboard;