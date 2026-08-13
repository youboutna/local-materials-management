// ============================================================
// src/pages/InsuranceManagement.tsx
// ============================================================
/**
 * Insurance Management Page
 * UI Layer - Gestion des assurances avec ProjectManager
 * Utilise ProjectManagerProvider pour fournir le contexte
 * Updated to use AlertService via useProjectManager hook
 * 
 * Hexagonal Architecture:
 * - UI Layer: Composants de présentation
 * - Application Layer: Services métier
 * - Domain Layer: Entités et DTOs
 */

import { actionLabels } from '@/application/services/ProjectManagerService';
import { getInsuranceService } from '@/application/services/InsuranceService';
import { getProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProjectManager } from '@/hooks/useProjectManager';
import { AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// DTOs
import type { Alert } from '@/domain/entities/Alert';
import type { EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';
import type { ProjectData } from '@/dtos/entities/ProjectDTO';
import type { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { InsuranceCertificateStatus } from '@/dtos/entities/InsuranceDTO';
import { formatAmount2, formatNumber2, formatPercent2 } from '@/utils/reportNumbers';

// ============================================================
// Types
// ============================================================
interface InsuranceStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  coverageTotal: number;
}

// ============================================================
// Composant contenu (utilise le hook)
// ============================================================
const InsuranceContent = () => {
  const { toast } = useToast();
  
  // ✅ ProjectManager hook pour les alertes
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading, runChecks } = useProjectManager();

  // Services
  const insuranceService = useMemo(() => getInsuranceService(), []);
  
  // État local pour les assurances
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceCertificateDTO[]>([]);
  const [insuranceStats, setInsuranceStats] = useState<InsuranceStats>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    coverageTotal: 0
  });
  const [isLoadingInsurance, setIsLoadingInsurance] = useState(false);

  // Utiliser alerts depuis state ou directement
  const allAlerts = state?.alerts || alerts || [];
  
  // Filtrer les alertes d'assurance
  const insuranceAlerts = allAlerts.filter((alert: Alert) => 
    alert.type === 'insurance_expiry' || 
    alert.type === 'insurance' ||
    alert.source === 'insurance' ||
    alert.title?.toLowerCase().includes('assurance') ||
    alert.message?.toLowerCase().includes('assurance')
  );

  // Récupérer les statistiques
  const stats = getSummaryStats();

  // ============================================================
  // Chargement des polices d'assurance
  // ============================================================
  const loadInsurancePolicies = useCallback(async () => {
    setIsLoadingInsurance(true);
    try {
      // Récupérer toutes les polices d'assurance via le service
      const policies = await insuranceService.getInsuranceCertificates();
      setInsurancePolicies(policies);

      // Calculer les statistiques
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const active = policies.filter(p => 
        p.status === InsuranceCertificateStatus.ACTIVE
      );
      const expiring = policies.filter(p => 
        p.status === InsuranceCertificateStatus.ACTIVE &&
        p.validUntil &&
        new Date(p.validUntil) <= thirtyDaysFromNow &&
        new Date(p.validUntil) >= now
      );
      const expired = policies.filter(p => 
        p.status === InsuranceCertificateStatus.EXPIRED ||
        (p.validUntil && new Date(p.validUntil) < now)
      );
      const coverageTotal = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);

      setInsuranceStats({
        total: policies.length,
        active: active.length,
        expiring: expiring.length,
        expired: expired.length,
        coverageTotal
      });
    } catch (error) {
      console.error('Error loading insurance policies:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les polices d\'assurance',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInsurance(false);
    }
  }, [insuranceService, toast]);

  // Chargement initial
  useEffect(() => {
    loadInsurancePolicies();
  }, [loadInsurancePolicies]);

  // ============================================================
  // Gestion des alertes
  // ============================================================
  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      const result = await acknowledgeAlert(alertId, 'current-user', 'Traité depuis la gestion des assurances');
      if (result) {
        toast({
          title: 'Succès',
          description: 'Alerte acquittée avec succès',
        });
        await runChecks();
        await loadInsurancePolicies();
      }
    } catch (error) {
      console.error('Erreur lors de l\'acquittement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'acquitter l\'alerte',
        variant: 'destructive',
      });
    }
  }, [acknowledgeAlert, runChecks, loadInsurancePolicies, toast]);

  // ============================================================
  // Rafraîchissement
  // ============================================================
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      runChecks(),
      loadInsurancePolicies()
    ]);
    toast({
      title: 'Rafraîchi',
      description: 'Les données ont été mises à jour',
    });
  }, [runChecks, loadInsurancePolicies, toast]);

  // ============================================================
  // États de chargement
  // ============================================================
  if (loading || isLoadingInsurance) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Chargement des données...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Gestion des Assurances
                </h1>
                <p className="text-muted-foreground mt-2">
                  Surveillance automatisée des certificats d'assurance et alertes d'expiration
                </p>
              </div>
              <div className="flex items-center gap-4">
                {insuranceAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {insuranceAlerts.length} Alerte(s) Active(s)
                  </Badge>
                )}
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{insuranceStats.total}</div>
                <p className="text-sm text-muted-foreground">Total polices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{insuranceStats.active}</div>
                <p className="text-sm text-muted-foreground">Actives</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-500">{insuranceStats.expiring}</div>
                <p className="text-sm text-muted-foreground">Expiration proche</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{insuranceStats.expired}</div>
                <p className="text-sm text-muted-foreground">Expirées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">
                  {formatAmount2(insuranceStats.coverageTotal)}
                </div>
                <p className="text-sm text-muted-foreground">Couverture totale</p>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques des alertes globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          {/* Alertes d'assurance */}
          {insuranceAlerts.length > 0 && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes d'Assurance
                  <Badge variant="destructive" className="ml-2">
                    {insuranceAlerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {insuranceAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 bg-white border rounded-lg ${
                        alert.severity === 'critical' ? 'border-red-300' :
                        alert.severity === 'high' ? 'border-orange-300' :
                        'border-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'critical' ? 'text-red-500' :
                              alert.severity === 'high' ? 'text-orange-500' :
                              'text-yellow-500'
                            }`} />
                            <p className="font-medium text-orange-800">
                              {alert.message || alert.title || 'Alerte'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                alert.severity === 'critical' ? 'text-red-600 border-red-200' :
                                alert.severity === 'high' ? 'text-orange-600 border-orange-200' :
                                'text-yellow-600 border-yellow-200'
                              }`}
                            >
                              {alert.severity || 'medium'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp || alert.createdAt || Date.now()).toLocaleString('fr-FR')}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {alert.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.status === 'open' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAcknowledge(alert.id)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Traiter
                            </Button>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Badge variant="secondary">En cours</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Composant principal - UnifiedInsuranceManager */}
          <UnifiedInsuranceManager />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Page principale avec Provider
// ============================================================
const InsuranceManagementPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectService = useMemo(() => getProjectService(), []);

  // ✅ Charger le projet avec gestion d'erreur
  useEffect(() => {
    const loadDefaultProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const projects = await projectService.getProjectsForInsurance();
        
        if (projects && projects.length > 0) {
          const project = projects[0];
          const projectData = {
            ...project,
            startDate: project.startDate || new Date().toISOString(),
            teamSize: project.teamSize || 0
          } as ProjectData;
          
          setSelectedProject(projectData);

          // Charger la hiérarchie via RepositoryFactory
          try {
            const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
            const hierarchy = await hierarchyRepository.getProjectHierarchy(project.id);
            setProjectHierarchy(hierarchy || []);
          } catch (hierarchyError) {
            console.warn('[InsuranceManagementPage] Erreur chargement hiérarchie:', hierarchyError);
            setProjectHierarchy([]);
          }
        } else {
          setError('Aucun projet trouvé');
        }
      } catch (err) {
        console.error('[InsuranceManagementPage] Erreur chargement projet:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultProject();
  }, [projectService]);

  // ===== Construction des rôles d'escalade =====
  const buildEscalationRoles = useCallback((): EscalationRoles => {
    if (projectHierarchy.length === 0) {
      return {
        level1: 'employee',
        level2: 'supervisor', 
        level3: 'manager',
        level4: 'director'
      };
    }

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

  // ===== États de chargement =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground">
            {error || 'Aucun projet trouvé. Veuillez créer un projet d\'abord.'}
          </p>
        </div>
      </div>
    );
  }

  // ===== Render avec le Provider =====
  return (
    <ProjectManagerProvider 
      project={selectedProject} 
      roles={buildEscalationRoles()} 
      actionLabels={actionLabels}
    >
      <InsuranceContent />
    </ProjectManagerProvider>
  );
};

export default InsuranceManagementPage;