import React, { useState, useEffect } from 'react';
import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/services/ProjectManagerService';
import { EscalationRoles, ProjectData } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

// Content component that uses ProjectManager
const InsuranceContent = () => {
  const { data, acknowledgeAlert } = useProjectManager();

  const insuranceAlerts = data?.alerts?.filter(alert => 
    alert.type === 'insurance_expiry' || alert.source === 'insurance'
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">🛡️ Gestion des Assurances</h1>
                <p className="text-muted-foreground mt-2">
                  Surveillance automatisée des certificats d'assurance et alertes d'expiration
                </p>
              </div>
              {insuranceAlerts.length > 0 && (
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {insuranceAlerts.length} Alerte(s) Active(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Project Manager Insurance Alerts */}
          {insuranceAlerts.length > 0 && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes d'Assurance du Gestionnaire de Projet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insuranceAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-white border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-orange-800">{alert.message}</p>
                           <p className="text-sm text-orange-600 mt-1">
                             Sévérité: {alert.severity} | Type: {alert.type}
                           </p>
                           <p className="text-xs text-orange-500 mt-1">
                             Détecté le: {new Date(alert.timestamp).toLocaleString('fr-FR')}
                           </p>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id, 'current-user', 'Traité depuis la gestion des assurances')}
                          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                        >
                          Traiter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <UnifiedInsuranceManager />
        </div>
      </div>
    </div>
  );
};

// Main component with ProjectManager provider
const InsuranceManagementPage = () => {
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
      <InsuranceContent />
    </ProjectManagerProvider>
  );
};

export default InsuranceManagementPage;