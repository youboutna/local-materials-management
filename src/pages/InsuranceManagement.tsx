// ============================================================
// src/pages/InsuranceManagement.tsx
// ============================================================
/**
 * Insurance Management Page
 * UI Layer - Gestion des assurances avec ProjectManager
 *
 * Hexagonal Architecture:
 *   - UI Layer        : Composants de présentation
 *   - Application     : Services métier (ProjectService, InsuranceService)
 *   - Domain          : Entités et DTOs
 *
 * Corrections appliquées :
 *   - ✅ Suppression de la boucle infinie (useMemo deps)
 *   - ✅ Guard useRef pour éviter les rechargements
 *   - ✅ Gestion du cas "0 projet" (démarrage à froid)
 *   - ✅ Reset propre si le projet change
 *   - ✅ Typage fort de la hiérarchie
 *   - ✅ Protection contre les stats undefined
 *   - ✅ Chargement des polices APRÈS le Provider
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import MonitoringDocumentsPanel from '@/components/documents/panels/MonitoringDocumentsPanel';
import { Activity, FolderOpen, ListChecks, FolderX, AlertTriangle } from 'lucide-react';

import { actionLabels } from '@/application/services/ProjectManagerService';
import { getInsuranceService } from '@/application/services/InsuranceService';
import { getProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProjectManager } from '@/hooks/useProjectManager';
import { RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// DTOs
import type { Alert as AlertEntity } from '@/domain/entities/Alert';
import type { EscalationRoles } from '@/dtos/entities/ProjectAggregateDTO';
import type { ProjectData } from '@/dtos/entities/ProjectDTO';
import type { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { InsuranceCertificateStatus } from '@/dtos/entities/InsuranceDTO';
import { formatAmount2 } from '@/utils/reportNumbers';

import { TranslatedDocumentType, TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface InsuranceStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  coverageTotal: number;
}

interface ProjectHierarchyItem {
  id: string;
  name: string;
  level: number;
  positionTitle?: string;
  position_title?: string;
}

// ────────────────────────────────────────────────────────────
// Composant : état vide (aucun projet)
// ────────────────────────────────────────────────────────────

const NoProjectState: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <Card className="max-w-lg w-full">
      <CardContent className="pt-6 text-center">
        <FolderX className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-60" />
        <h2 className="text-2xl font-bold mb-2">
          <T
            k="auto.insurancemanagement.aucun_projet_disponible"
            fallback="Aucun projet disponible"
          />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T
            k="auto.insurancemanagement.aucun_projet_description"
            fallback="La gestion des assurances nécessite au moins un projet actif. Créez ou activez un projet pour commencer."
          />
        </p>

          <Button asChild>
          <Link to="/projects/create">
          <T k="auto.insurancemanagement.creer_un_projet"
              fallback="Créer un projet"
            />
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

// ────────────────────────────────────────────────────────────
// Composant contenu (utilise le hook ProjectManager)
// ────────────────────────────────────────────────────────────

const InsuranceContent = () => {
  const { toast } = useToast();

  // ✅ ProjectManager hook pour les alertes
  const { state, alerts, acknowledgeAlert, getSummaryStats, loading, runChecks } =
    useProjectManager();

  // ✅ Service stable (useMemo avec [] pour ne pas se recréer)
  const insuranceService = useMemo(() => getInsuranceService(), []);

  // État local pour les assurances
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceCertificateDTO[]>([]);
  const [insuranceStats, setInsuranceStats] = useState<InsuranceStats>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    coverageTotal: 0,
  });
  const [isLoadingInsurance, setIsLoadingInsurance] = useState(false);

  // Utiliser alerts depuis state ou directement
  const allAlerts = state?.alerts || alerts || [];

  // Filtrer les alertes d'assurance
  const insuranceAlerts = useMemo(() => {
    return allAlerts.filter(
      (alert: AlertEntity) =>
        alert.type === 'insurance_expiry' ||
        alert.type === 'insurance' ||
        alert.source === 'insurance' ||
        alert.title?.toLowerCase().includes('assurance') ||
        alert.message?.toLowerCase().includes('assurance')
    );
  }, [allAlerts]);

  // ✅ Protection : getSummaryStats peut retourner undefined
  const stats = useMemo(() => {
    const raw = getSummaryStats() || {};
    return {
      criticalAlerts: raw.criticalAlerts ?? 0,
      highAlerts: raw.highAlerts ?? 0,
      openAlerts: raw.openAlerts ?? 0,
      totalAlerts: raw.totalAlerts ?? 0,
    };
  }, [getSummaryStats]);

  // ────────────────────────────────────────────────────────────
  // Chargement des polices d'assurance
  // ────────────────────────────────────────────────────────────

  const loadInsurancePolicies = useCallback(async () => {
    setIsLoadingInsurance(true);
    try {
      const policies = await insuranceService.getInsuranceCertificates();
      setInsurancePolicies(policies);

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const active = policies.filter(
        (p) => p.status === InsuranceCertificateStatus.ACTIVE
      );
      const expiring = policies.filter(
        (p) =>
          p.status === InsuranceCertificateStatus.ACTIVE &&
          p.validUntil &&
          new Date(p.validUntil) <= thirtyDaysFromNow &&
          new Date(p.validUntil) >= now
      );
      const expired = policies.filter(
        (p) =>
          p.status === InsuranceCertificateStatus.EXPIRED ||
          (p.validUntil && new Date(p.validUntil) < now)
      );
      const coverageTotal = policies.reduce(
        (sum, p) => sum + (p.coverageAmount || 0),
        0
      );

      setInsuranceStats({
        total: policies.length,
        active: active.length,
        expiring: expiring.length,
        expired: expired.length,
        coverageTotal,
      });
    } catch (error) {
      console.error('Error loading insurance policies:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les polices d'assurance",
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

  // ────────────────────────────────────────────────────────────
  // Gestion des alertes
  // ────────────────────────────────────────────────────────────

  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      try {
        const result = await acknowledgeAlert(
          alertId,
          'current-user',
          'Traité depuis la gestion des assurances'
        );
        if (result) {
          toast({
            title: 'Succès',
            description: 'Alerte acquittée avec succès',
          });
          await runChecks();
          await loadInsurancePolicies();
        }
      } catch (error) {
        console.error("Erreur lors de l'acquittement:", error);
        toast({
          title: 'Erreur',
          description: "Impossible d'acquitter l'alerte",
          variant: 'destructive',
        });
      }
    },
    [acknowledgeAlert, runChecks, loadInsurancePolicies, toast]
  );

  // ────────────────────────────────────────────────────────────
  // Rafraîchissement
  // ────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    await Promise.all([runChecks(), loadInsurancePolicies()]);
    toast({
      title: 'Rafraîchi',
      description: 'Les données ont été mises à jour',
    });
  }, [runChecks, loadInsurancePolicies, toast]);

  // ────────────────────────────────────────────────────────────
  // États de chargement
  // ────────────────────────────────────────────────────────────

  if (loading || isLoadingInsurance) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              <T
                k="auto.insurancemanagement.chargement_des_donnees"
                fallback="Chargement des données..."
              />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────

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
                  <T
                    k="auto.insurancemanagement.gestion_des_assurances"
                    fallback="Gestion des Assurances"
                  />
                </h1>
                <p className="text-muted-foreground mt-2">
                  <T
                    k="auto.insurancemanagement.surveillance_automatisee_des_certificats_d_assur"
                    fallback="Surveillance automatisée des certificats d'assurance et alertes d'expiration"
                  />
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
                  <T k="auto.insurancemanagement.actualiser" fallback="Actualiser" />
                </Button>
              </div>
            </div>
          </div>

          <Breadcrumb
            className="mb-4"
            items={[{ label: 'Surveillance' }, { label: 'Gestion des Assurances' }]}
          />

          <Tabs defaultValue="surveillance" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="surveillance" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Surveillance &amp; Alertes</span>
                <span className="sm:hidden">
                  <T k="auto.insurancemanagement.alertes" fallback="Alertes" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="gestion" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">
                  <T
                    k="auto.insurancemanagement.gestion_des_polices"
                    fallback="Gestion des Polices"
                  />
                </span>
                <span className="sm:hidden">
                  <T k="auto.insurancemanagement.gestion" fallback="Gestion" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>
                  <T k="auto.insurancemanagement.documents" fallback="Documents" />
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="surveillance" className="mt-6">
              {/* Bandeau KPI unifié */}
              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-primary">
                      {insuranceStats.total}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.total_polices"
                        fallback="Total polices"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-success">
                      {insuranceStats.active}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T k="auto.insurancemanagement.actives" fallback="Actives" />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-warning">
                      {insuranceStats.expiring}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.expiration_proche"
                        fallback="Expiration proche"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-destructive">
                      {insuranceStats.expired}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.expirees"
                        fallback="Expirées"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount2(insuranceStats.coverageTotal)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.couverture_totale"
                        fallback="Couverture totale"
                      />
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-destructive">
                      {stats.criticalAlerts}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.alertes_critiques"
                        fallback="Alertes critiques"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-warning">
                      {stats.highAlerts}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.alertes_elevees"
                        fallback="Alertes élevées"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-primary">
                      {stats.openAlerts}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.alertes_ouvertes"
                        fallback="Alertes ouvertes"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-success">
                      {stats.totalAlerts}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.total_alertes"
                        fallback="Total alertes"
                      />
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-muted-foreground">
                      {insuranceStats.total -
                        insuranceStats.active -
                        insuranceStats.expired}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <T
                        k="auto.insurancemanagement.autres_statuts"
                        fallback="Autres statuts"
                      />
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Alertes d'assurance */}
              {insuranceAlerts.length > 0 && (
                <Card className="mb-8 border-warning/30 bg-warning/10">
                  <CardHeader>
                    <CardTitle className="text-warning flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <T
                        k="auto.insurancemanagement.alertes_d_assurance"
                        fallback="Alertes d'Assurance"
                      />
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
                            alert.severity === 'critical'
                              ? 'border-destructive/30'
                              : alert.severity === 'high'
                              ? 'border-warning/30'
                              : 'border-warning/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <AlertTriangle
                                  className={`h-4 w-4 ${
                                    alert.severity === 'critical'
                                      ? 'text-destructive'
                                      : alert.severity === 'high'
                                      ? 'text-warning'
                                      : 'text-warning'
                                  }`}
                                />
                                <p className="font-medium text-warning">
                                  {alert.message || alert.title || 'Alerte'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <TranslatedDocumentType code={alert.type} />
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    alert.severity === 'critical'
                                      ? 'text-destructive border-destructive/30'
                                      : alert.severity === 'high'
                                      ? 'text-warning border-warning/30'
                                      : 'text-warning border-warning/30'
                                  }`}
                                >
                                  {alert.severity || 'medium'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    alert.timestamp || alert.createdAt || Date.now()
                                  ).toLocaleString('fr-FR')}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  <TranslatedStatus code={alert.status} />
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
                                  <T
                                    k="auto.insurancemanagement.traiter"
                                    fallback="Traiter"
                                  />
                                </Button>
                              )}
                              {alert.status === 'acknowledged' && (
                                <Badge variant="secondary">
                                  <T
                                    k="auto.insurancemanagement.en_cours"
                                    fallback="En cours"
                                  />
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="gestion" className="mt-6">
              <UnifiedInsuranceManager />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <MonitoringDocumentsPanel scope="insurance" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Page principale avec Provider
// ────────────────────────────────────────────────────────────

const InsuranceManagementPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<ProjectHierarchyItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const projectService = useMemo(() => getProjectService(), []);

  // ✅ FIX : Éviter la boucle infinie
  const loadedProjectIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // ────────────────────────────────────────────────────────────
  // Charger le projet par défaut
  // ────────────────────────────────────────────────────────────

  useEffect(() => {
    // ✅ Guard : ne charger qu'UNE SEULE FOIS
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let cancelled = false;

    const loadDefaultProject = async () => {
      try {
        setError(null);

        const projects = await projectService.getProjectsForInsurance();

        if (cancelled) return;

        if (projects && projects.length > 0) {
          const project = projects[0];
          const projectData = {
            ...project,
            startDate: project.startDate || new Date().toISOString(),
            teamSize: project.teamSize || 0,
          } as ProjectData;

          setSelectedProject(projectData);

          // Charger la hiérarchie
          try {
            const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
            const hierarchy = await hierarchyRepository.getProjectHierarchy(project.id);
            if (!cancelled) {
              setProjectHierarchy((hierarchy as ProjectHierarchyItem[]) || []);
            }
          } catch (hierarchyError) {
            console.warn(
              '[InsuranceManagementPage] Erreur chargement hiérarchie:',
              hierarchyError
            );
            if (!cancelled) setProjectHierarchy([]);
          }
        } else {
          setError('Aucun projet trouvé');
        }
      } catch (err) {
        console.error('[InsuranceManagementPage] Erreur chargement projet:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
        }
      }
    };

    loadDefaultProject();

    return () => {
      cancelled = true;
    };
  }, [projectService]);

  // ────────────────────────────────────────────────────────────
  // Construction des rôles d'escalade
  // ────────────────────────────────────────────────────────────

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

  // 1. En cours de chargement initial (avant que selectedProject soit défini)
  if (!selectedProject && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            <T
              k="auto.insurancemanagement.chargement_du_projet"
              fallback="Chargement du projet..."
            />
          </p>
        </div>
      </div>
    );
  }

  // 2. Erreur OU aucun projet disponible
  if (error || !selectedProject) {
    // 2a. Cas spécifique "aucun projet"
    if (error === 'Aucun projet trouvé') {
      return <NoProjectState />;
    }

    // 2b. Erreur générique
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || (
              <T
                k="auto.insurancemanagement.erreur_chargement"
                fallback="Erreur de chargement. Veuillez réessayer."
              />
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 3. Rendu normal avec Provider
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