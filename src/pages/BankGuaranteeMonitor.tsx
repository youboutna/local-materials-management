// ============================================================
// src/pages/BankGuaranteeMonitor.tsx
// ============================================================
/**
 * Bank Guarantee Monitor Page
 * UI Layer - Surveillance des garanties bancaires avec ProjectManager
 * Updated to use AlertService via useProjectManager hook
 *
 * Corrections appliquées :
 *   - ✅ Gestion du cas "0 projet" (démarrage à froid)
 *   - ✅ Suppression de la boucle infinie (useRef + guards)
 *   - ✅ Gestion d'erreur explicite
 *   - ✅ Typage fort de la hiérarchie
 *   - ✅ Rendu conditionnel ordonné
 */

import { actionLabels } from '@/application/services/ProjectManagerService';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedBankGuaranteeCrud from '@/components/alerts/EnhancedBankGuaranteeCrud';
import { AppLayout } from '@/components/layout';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import MonitoringDocumentsPanel from '@/components/documents/panels/MonitoringDocumentsPanel';
import { Activity, FolderOpen, ListChecks, FolderX, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Alert as AlertEntity } from '@/domain/entities/Alert';
import type { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import type { EscalationRoles } from '@/domain/entities/Hierarchy';
import { useBankGuaranteesHex, useProjectsHex } from '@/hooks/hexagonal';
import { useProjectManager } from '@/hooks/useProjectManager';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useCallback, useEffect, useRef, useState } from 'react';
import { T } from '@/components/i18n/T';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

// ────────────────────────────────────────────────────────────
// Type hiérarchie (typage fort)
// ────────────────────────────────────────────────────────────

interface ProjectHierarchyItem {
  id: string;
  name: string;
  level: number;
  positionTitle?: string;
  position_title?: string; // fallback snake_case
}

// ────────────────────────────────────────────────────────────
// Composant : état vide (aucun projet)
// ────────────────────────────────────────────────────────────

const NoProjectState: React.FC = () => (
  <AppLayout
    pageTitle="🏦 Surveillance Garanties Bancaires"
    pageDescription="Aucun projet disponible pour la surveillance"
  >
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-6 text-center">
          <FolderX className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-60" />
          <h2 className="text-2xl font-bold mb-2">
            <T
              k="auto.bankguaranteemonitor.aucun_projet_disponible"
              fallback="Aucun projet disponible"
            />
          </h2>
          <p className="text-muted-foreground mb-6">
            <T
              k="auto.bankguaranteemonitor.aucun_projet_disponible_description"
              fallback="La surveillance des garanties bancaires nécessite au moins un projet actif. Créez ou activez un projet pour commencer."
            />
          </p>

          <Button asChild>
            <Link to="/projects/create">
              <T
                k="auto.bankguaranteemonitor.creer_un_projet"
                fallback="Créer un projet"
              />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  </AppLayout>
);

// ────────────────────────────────────────────────────────────
// Composant contenu (utilise le hook ProjectManager)
// ────────────────────────────────────────────────────────────

const BankGuaranteeContent = () => {
  const { t } = useLanguage();

  // ✅ Le hook retourne un fallback si pas de Provider
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading } = useProjectManager();

  // Utiliser alerts depuis state ou directement
  const allAlerts = state?.alerts || alerts || [];

  // Filtrer les alertes de garanties bancaires
  const bankGuaranteeAlerts = allAlerts.filter(
    (alert: AlertEntity) =>
      alert.type === 'bank_guarantee' ||
      String(alert.type) === 'guarantee' ||
      alert.source === 'bank_guarantee'
  );

  // Récupérer les statistiques
  const stats = getSummaryStats();

  // Gestion de l'acquittement
  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      try {
        const success = await acknowledgeAlert(
          alertId,
          'current-user',
          'Pris en compte depuis le monitoring'
        );
        if (success) {
          // Optionnel: toast de succès
        }
      } catch (error) {
        console.error("Erreur lors de l'acquittement:", error);
      }
    },
    [acknowledgeAlert]
  );

  if (loading) {
    return (
      <AppLayout
        pageTitle="🏦 Surveillance Garanties Bancaires"
        pageDescription="Chargement..."
      >
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
      <Breadcrumb
        className="mb-4"
        items={[{ label: 'Surveillance' }, { label: 'Garanties Bancaires' }]}
      />

      <Tabs defaultValue="surveillance" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="surveillance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Surveillance &amp; Alertes</span>
            <span className="sm:hidden">
              <T k="auto.bankguaranteemonitor.alertes" fallback="Alertes" />
            </span>
          </TabsTrigger>
          <TabsTrigger value="gestion" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">
              <T
                k="auto.bankguaranteemonitor.gestion_des_garanties"
                fallback="Gestion des Garanties"
              />
            </span>
            <span className="sm:hidden">
              <T k="auto.bankguaranteemonitor.gestion" fallback="Gestion" />
            </span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>
              <T k="auto.bankguaranteemonitor.documents" fallback="Documents" />
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surveillance" className="mt-6 space-y-8">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-destructive">
                  {stats.criticalAlerts}
                </div>
                <p className="text-sm text-muted-foreground">
                  <T
                    k="auto.bankguaranteemonitor.alertes_critiques"
                    fallback="Alertes critiques"
                  />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-warning">
                  {stats.highAlerts || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  <T
                    k="auto.bankguaranteemonitor.alertes_elevees"
                    fallback="Alertes élevées"
                  />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">
                  {stats.openAlerts || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  <T
                    k="auto.bankguaranteemonitor.alertes_ouvertes"
                    fallback="Alertes ouvertes"
                  />
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-success">
                  {stats.totalAlerts}
                </div>
                <p className="text-sm text-muted-foreground">
                  <T
                    k="auto.bankguaranteemonitor.total_alertes"
                    fallback="Total alertes"
                  />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Project Manager Alerts */}
          {bankGuaranteeAlerts.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <span>🚨 Alertes Garanties Bancaires</span>
                  <Badge variant="destructive">{bankGuaranteeAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankGuaranteeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-background border border-destructive/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-destructive">
                            {alert.message || alert.title || 'Alerte'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sévérité: {alert.severity || 'medium'} | Type:{' '}
                            {alert.type || 'unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Détecté le:{' '}
                            {new Date(
                              alert.timestamp || alert.createdAt || Date.now()
                            ).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAcknowledge(alert.id)}
                        >
                          <T
                            k="auto.bankguaranteemonitor.acquitter"
                            fallback="Acquitter"
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Surveillance + seuils d'escalade */}
          <BankGuaranteeMonitor />
        </TabsContent>

        <TabsContent value="gestion" className="mt-6">
          <EnhancedBankGuaranteeCrud />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <MonitoringDocumentsPanel scope="bank_guarantee" />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

// ────────────────────────────────────────────────────────────
// Page principale avec Provider
// ────────────────────────────────────────────────────────────

const BankGuaranteeMonitorPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<ProjectHierarchyItem[]>([]);

  // ✅ Utiliser les hooks hexagonaux
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjectsHex();

  // ✅ FIX : Charger les stats garanties SEULEMENT après sélection du projet
  // (évite les appels non nécessaires au démarrage)
  const { stats: guaranteeStats } = useBankGuaranteesHex({
    enabled: !!selectedProject,
  });

  // ✅ FIX : Éviter la boucle infinie
  const hasProjects = projects && projects.length > 0;

  // ✅ FIX : useRef pour ne charger la hiérarchie qu'UNE SEULE FOIS par projet
  const loadedProjectIdRef = useRef<string | null>(null);

  // Helper function
  const toISOStringSafe = useCallback(
    (date: string | Date | undefined | null): string => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return date;
      return date.toISOString();
    },
    []
  );

  // ✅ Charger la hiérarchie avec guard
  const loadProjectHierarchy = useCallback(
    async (projectId: string) => {
      if (loadedProjectIdRef.current === projectId) return;
      loadedProjectIdRef.current = projectId;

      try {
        const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
        const hierarchy = await hierarchyRepository.getProjectHierarchy(projectId);
        setProjectHierarchy((hierarchy as ProjectHierarchyItem[]) || []);
      } catch (error) {
        console.error(
          '[BankGuaranteeMonitorPage] Erreur chargement hiérarchie:',
          error
        );
        setProjectHierarchy([]);
      }
    },
    []
  );

  // ✅ FIX : Un seul useEffect avec guards + deps stables
  useEffect(() => {
    // Guard 1 : en cours de chargement
    if (projectsLoading) return;

    // Guard 2 : aucun projet (démarrage à froid)
    if (!hasProjects) return;

    // Guard 3 : projet déjà sélectionné
    if (selectedProject) return;

    // Sélectionner le projet actif ou le premier par défaut
    const activeProject =
      projects.find((p) => String(p.status) === 'en cours') || projects[0];

    const projectData: ProjectDTO = {
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
      currency: 'MRU',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedProject(projectData);
    loadProjectHierarchy(activeProject.id);
  }, [
    projectsLoading,
    hasProjects,
    projects,
    selectedProject,
    toISOStringSafe,
    loadProjectHierarchy,
  ]);

  // ✅ FIX : Reset propre si les projets disparaissent
  useEffect(() => {
    if (!hasProjects && !projectsLoading) {
      setSelectedProject(null);
      setProjectHierarchy([]);
      loadedProjectIdRef.current = null;
    }
  }, [hasProjects, projectsLoading]);

  // Build dynamic escalation roles from project hierarchy
  const buildEscalationRoles = useCallback((): EscalationRoles => {
    if (projectHierarchy.length === 0) {
      return {
        level1: 'employee',
        level2: 'supervisor',
        level3: 'manager',
        level4: 'director',
      };
    }

    const sortedHierarchy = [...projectHierarchy].sort((a, b) => a.level - b.level);
    const levels = [...new Set(sortedHierarchy.map((h) => h.level))].sort();

    const roles: EscalationRoles = {
      level1: 'employee',
      level2: 'supervisor',
      level3: 'manager',
      level4: 'director',
    };

    // Map actual hierarchy positions to escalation levels
    if (levels.length >= 1) {
      const highestLevel = sortedHierarchy.filter((h) => h.level === levels[0]);
      roles.level4 =
        highestLevel[0]?.positionTitle ||
        highestLevel[0]?.position_title ||
        'director';
    }

    if (levels.length >= 2) {
      const secondLevel = sortedHierarchy.filter((h) => h.level === levels[1]);
      roles.level3 =
        secondLevel[0]?.positionTitle ||
        secondLevel[0]?.position_title ||
        'manager';
    }

    if (levels.length >= 3) {
      const thirdLevel = sortedHierarchy.filter((h) => h.level === levels[2]);
      roles.level2 =
        thirdLevel[0]?.positionTitle ||
        thirdLevel[0]?.position_title ||
        'supervisor';
    }

    return roles;
  }, [projectHierarchy]);

  // ────────────────────────────────────────────────────────────
  // RENDU CONDITIONNEL ORDONNÉ
  // ────────────────────────────────────────────────────────────

  // 1. En cours de chargement des projets
  if (projectsLoading) {
    return (
      <AppLayout
        pageTitle="🏦 Surveillance Garanties Bancaires"
        pageDescription="Chargement..."
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              <T
                k="auto.bankguaranteemonitor.chargement_du_projet_et_de_l_organisation"
                fallback="Chargement du projet et de l'organisation..."
              />
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 2. Erreur de chargement
  if (projectsError) {
    return (
      <AppLayout
        pageTitle="🏦 Surveillance Garanties Bancaires"
        pageDescription="Erreur de chargement"
      >
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <T
                k="auto.bankguaranteemonitor.erreur_chargement_projets"
                fallback="Erreur lors du chargement des projets. Veuillez réessayer."
              />
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  // 3. Aucun projet disponible (démarrage à froid)
  if (!hasProjects) {
    return <NoProjectState />;
  }

  // 4. Projet en cours de sélection
  if (!selectedProject) {
    return (
      <AppLayout
        pageTitle="🏦 Surveillance Garanties Bancaires"
        pageDescription="Chargement..."
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              <T
                k="auto.bankguaranteemonitor.chargement_du_projet_et_de_l_organisation"
                fallback="Chargement du projet et de l'organisation..."
              />
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // 5. Rendu normal avec Provider
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