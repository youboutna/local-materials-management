import React, { useState, useEffect, useMemo } from 'react';
import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/application/services/ProjectManagerService';
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
import type { ProjectData, EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
  const [projectHierarchy, setProjectHierarchy] = useState<unknown[]>([]);

  // Initialize service with useMemo to prevent re-creation
  const projectService = useMemo(() => 
    new ProjectService(RepositoryFactory.getProjectRepository()), []);

  useEffect(() => {
    // Load a default project for monitoring with its hierarchy
    const loadDefaultProject = async () => {
      try {
        // Use ProjectService instead of direct Supabase call
        const projects = await projectService.getProjectsForInsurance();
        
        if (projects && projects.length > 0) {
          const project = projects[0];
          const projectData = {
            ...project,
            startDate: project.startDate || new Date().toISOString(),
            teamSize: project.teamSize || 0
          } as ProjectData;
          
          setSelectedProject(projectData);

          // Load organizational hierarchy for this project
          // Note: This RPC call might need to be moved to a service method
          // For now, keeping it as is since it's a specific RPC call
          // TODO: Move this to ProjectService when available
          // Since getProjectHierarchy doesn't exist on ProjectService, we'll skip this for now
          const hierarchy: unknown[] = [];
          
          setProjectHierarchy(hierarchy || []);
        }
      } catch (error) {
        console.error('Error loading default project:', error);
      }
    };

    loadDefaultProject();
  }, [projectService]);

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

    // Type assertion for hierarchy items
    const hierarchyItems = projectHierarchy as Array<{
      level: number;
      position_title?: string;
    }>;
    
    const sortedHierarchy = [...hierarchyItems].sort((a, b) => a.level - b.level);
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
      actionLabels={actionLabels as any}
    >
      <InsuranceContent />
    </ProjectManagerProvider>
  );
};

export default InsuranceManagementPage;