// ============================================================
// src/pages/BankGuaranteeMonitor.tsx
// ============================================================
/**
 * Bank Guarantee Monitor Page
 * UI Layer - Surveillance des garanties bancaires avec ProjectManager
 * Updated to use AlertService via useProjectManager hook
 */

import { actionLabels } from '@/application/services/ProjectManagerService';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedBankGuaranteeCrud from '@/components/alerts/EnhancedBankGuaranteeCrud';
import { AppLayout } from '@/components/layout';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Alert } from '@/domain/entities/Alert';
import { EscalationRoles, ProjectData } from '@/dtos/entities/ProjectDTO';
import { useBankGuaranteesHex, useProjectsHex } from '@/hooks/hexagonal';
import { useProjectManager } from '@/hooks/useProjectManager';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback, useEffect, useState } from 'react';

// ============================================================
// Composant contenu (utilise le hook)
// ============================================================
const BankGuaranteeContent = () => {
  const { t } = useLanguage();
  // ✅ Le hook retourne un fallback si pas de Provider
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading } = useProjectManager();

  // Utiliser alerts depuis state ou directement
  const allAlerts = state?.alerts || alerts || [];
  
  // Filtrer les alertes de garanties bancaires
  const bankGuaranteeAlerts = allAlerts.filter((alert: Alert) => 
    alert.type === 'bank_guarantee' || 
    alert.type === 'guarantee' ||
    alert.source === 'bank_guarantee'
  );

  // Récupérer les statistiques
  const stats = getSummaryStats();

  // Gestion de l'acquittement
  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      const success = await acknowledgeAlert(alertId, 'current-user', 'Pris en compte depuis le monitoring');
      if (success) {
        // Optionnel: toast de succès
      }
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
    }
  }, [acknowledgeAlert]);

  if (loading) {
    return (
      <AppLayout pageTitle="🏦 Surveillance Garanties Bancaires" pageDescription="Chargement...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

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
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
              <p className="text-sm text-muted-foreground">Alertes critiques</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{stats.highAlerts || 0}</div>
              <p className="text-sm text-muted-foreground">Alertes élevées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{stats.openAlerts || 0}</div>
              <p className="text-sm text-muted-foreground">Alertes ouvertes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{stats.totalAlerts}</div>
              <p className="text-sm text-muted-foreground">Total alertes</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Manager Alerts */}
        {bankGuaranteeAlerts.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <span>🚨 Alertes Garanties Bancaires</span>
                <Badge variant="destructive">{bankGuaranteeAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bankGuaranteeAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-white border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">{alert.message || alert.title || 'Alerte'}</p>
                        <p className="text-sm text-red-600 mt-1">
                          Sévérité: {alert.severity || 'medium'} | Type: {alert.type || 'unknown'}
                        </p>
                        <p className="text-xs text-red-500 mt-1">
                          Détecté le: {new Date(alert.timestamp || alert.createdAt || Date.now()).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
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
        
        {/* Composants de monitoring */}
        <BankGuaranteeMonitor />
        <div className="mt-8">
          <EnhancedBankGuaranteeCrud />
        </div>
      </div>
    </AppLayout>
  );
};

// ============================================================
// Page principale avec Provider
// ============================================================
const BankGuaranteeMonitorPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Utiliser les hooks hexagonaux
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  const { stats: guaranteeStats } = useBankGuaranteesHex();

  // Helper function
  const toISOStringSafe = (date: string | Date | undefined | null): string => {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date;
    return date.toISOString();
  };

  // ✅ Utiliser le service via RepositoryFactory au lieu de Supabase direct
  const loadProjectHierarchy = useCallback(async (projectId: string) => {
    try {
      const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
      const hierarchy = await hierarchyRepository.getProjectHierarchy(projectId);
      setProjectHierarchy(hierarchy || []);
    } catch (error) {
      console.error('[BankGuaranteeMonitorPage] Erreur chargement hiérarchie:', error);
      setProjectHierarchy([]);
    }
  }, []);

  // Sélectionner le projet
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const activeProject = projects.find(p => p.status === 'en cours') || projects[0];
      const projectData: ProjectData = {
        id: activeProject.id,
        title: activeProject.title,
        description: activeProject.description || '',
        location: activeProject.location || '',
        status: activeProject.status,
        progress: activeProject.progress || 0,
        budget: activeProject.budget || 0,
        startDate: toISOStringSafe(activeProject.startDate),
        endDate: toISOStringSafe(activeProject.endDate),
        teamSize: 0,
        thumbnail: undefined,
      };
      
      setSelectedProject(projectData);
      loadProjectHierarchy(activeProject.id);
      setIsLoading(false);
    }
  }, [projects, selectedProject, loadProjectHierarchy]);

  // Build dynamic escalation roles from project hierarchy
  const buildEscalationRoles = useCallback((): EscalationRoles => {
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
  }, [projectHierarchy]);

  // États de chargement
  if (projectsLoading || isLoading || !selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet et de l'organisation...</p>
        </div>
      </div>
    );
  }

  // ✅ Render avec le Provider
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