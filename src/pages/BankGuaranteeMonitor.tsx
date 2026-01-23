import React, { useState, useEffect } from 'react';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedBankGuaranteeCrud from '@/components/alerts/EnhancedBankGuaranteeCrud';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { useProjectManager } from '@/hooks/useProjectManager';
import { actionLabels } from '@/application/services/ProjectManagerService';
import { EscalationRoles, ProjectData } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectsHex, useBankGuaranteesHex } from '@/hooks/hexagonal';
import { AppLayout } from '@/components/layout';
import { useLanguage } from '@/contexts/LanguageContext';

// Content component that uses ProjectManager
const BankGuaranteeContent = () => {
  const { t } = useLanguage();
  const { data, acknowledgeAlert } = useProjectManager();

  const bankGuaranteeAlerts = data?.alerts?.filter(alert => 
    alert.type === 'bank_guarantee' || alert.source === 'bank_guarantee'
  ) || [];

  return (
    <AppLayout
      pageTitle="🏦 Surveillance Garanties Bancaires"
      pageDescription="Système automatisé de détection des retards et déclenchement des garanties bancaires"
      actions={
        bankGuaranteeAlerts.length > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {bankGuaranteeAlerts.length} Alerte(s) Active(s)
          </Badge>
        )
      }
    >
      <div className="space-y-8">

          {/* Project Manager Alerts */}
          {bankGuaranteeAlerts.length > 0 && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Alertes du Gestionnaire de Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankGuaranteeAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-white border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-800">{alert.message}</p>
                        <p className="text-sm text-red-600 mt-1">
                          Sévérité: {alert.severity} | Type: {alert.type}
                        </p>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id, 'current-user', 'Pris en compte depuis le monitoring')}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Acquitter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        
        <BankGuaranteeMonitor />
        <div className="mt-8">
          <EnhancedBankGuaranteeCrud />
        </div>
      </div>
    </AppLayout>
  );
};

// Main component with ProjectManager provider
const BankGuaranteeMonitorPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<any[]>([]);
  
  // Use hexagonal hook for projects
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  
  // Use hexagonal hook for bank guarantees stats
  const { stats: guaranteeStats } = useBankGuaranteesHex();

  // Helper function to safely convert date to ISO string
  const toISOStringSafe = (date: string | Date | undefined | null): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  useEffect(() => {
    // Select first active project when projects are loaded
    if (projects.length > 0 && !selectedProject) {
      const activeProject = projects.find(p => p.status === 'en cours') || projects[0];
      const projectData: ProjectData = {
        id: activeProject.id,
        title: activeProject.title,
        description: activeProject.description || '',
        location: activeProject.location || '',
        status: activeProject.status,
        progress: activeProject.progress,
        budget: activeProject.budget,
        startDate: toISOStringSafe(activeProject.startDate),
        endDate: toISOStringSafe(activeProject.endDate),
        teamSize: 0,
        thumbnail: undefined,
      };
      
      setSelectedProject(projectData);
      
      // Load organizational hierarchy for this project (still needs supabase for RPC)
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase
          .rpc('get_project_hierarchy', { project_id_param: activeProject.id })
          .then(({ data: hierarchy }) => {
            setProjectHierarchy(hierarchy || []);
          });
      });
    }
  }, [projects, selectedProject]);

  // Build dynamic escalation roles from project hierarchy
  const buildEscalationRoles = (): EscalationRoles => {
    if (projectHierarchy.length === 0) {
      return {
        level1: 'employee',
        level2: 'supervisor', 
        level3: 'manager'
      };
    }

    const sortedHierarchy = [...projectHierarchy].sort((a, b) => a.level - b.level);
    const levels = [...new Set(sortedHierarchy.map(h => h.level))].sort();
    
    const roles: EscalationRoles = {
      level1: 'employee',
      level2: 'supervisor',
      level3: 'manager'
    };

    // Map actual hierarchy positions to escalation levels
    if (levels.length >= 1) {
      const highestLevel = sortedHierarchy.filter(h => h.level === levels[0]);
      roles.level3 = highestLevel[0]?.position_title || 'manager';
    }
    
    if (levels.length >= 2) {
      const midLevel = sortedHierarchy.filter(h => h.level === levels[1]);
      roles.level2 = midLevel[0]?.position_title || 'supervisor';
    }
    
    if (levels.length >= 3) {
      const lowestLevel = sortedHierarchy.filter(h => h.level === levels[2]);
      roles.level1 = lowestLevel[0]?.position_title || 'employee';
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
      actionLabels={actionLabels}
    >
      <BankGuaranteeContent />
    </ProjectManagerProvider>
  );
};

export default BankGuaranteeMonitorPage;