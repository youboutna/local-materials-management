import { actionLabels } from '@/application/services/ProjectManagerService';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import PaymentCrud from '@/components/payments/PaymentCrud';
import { UnifiedPaymentFormDialog } from '@/components/payments/UnifiedPaymentFormDialog';
import { ProjectManagerProvider } from '@/components/project/ProjectManagerProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import MonitoringDocumentsPanel from '@/components/documents/panels/MonitoringDocumentsPanel';
import FinancialDoctrineCard from '@/components/finance/FinancialDoctrineCard';
import { PAYMENT_CONTROL_THRESHOLDS } from '@/config/referentials/payment-tolerance.referential';
import { PaymentOriginKey } from '@/config/referentials/payment-origin.referential';
import { useNotificationsHex, useProjectsHex } from '@/hooks/hexagonal';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, Bell, CheckCircle, Clock, CreditCard,
  Eye, ExternalLink, PlusCircle, Activity, ListChecks,
  FolderOpen, ChevronDown, SlidersHorizontal, FolderX
} from 'lucide-react';
import { formatAmount2 } from '@/utils/reportNumbers';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Alert as AlertEntity } from '@/domain/entities/Alert';
import { EscalationRoles } from '@/domain/entities/Hierarchy';
import { ProjectData } from '@/dtos/entities/ProjectAggregateDTO';
import { T } from '@/components/i18n/T';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

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
            k="auto.paymentcontrol.aucun_projet_disponible"
            fallback="Aucun projet disponible"
          />
        </h2>
        <p className="text-muted-foreground mb-6">
          <T
            k="auto.paymentcontrol.aucun_projet_disponible_description"
            fallback="Le contrôle des paiements nécessite au moins un projet actif. Créez ou activez un projet pour commencer."
          />
        </p>
        <Button asChild>
          <Link to="/projects/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            <T k="auto.paymentcontrol.creer_un_projet" fallback="Créer un projet" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

// ────────────────────────────────────────────────────────────
// Composant : contenu du contrôle des paiements
// ────────────────────────────────────────────────────────────

const PaymentControlContent = ({ project }: { project: ProjectData | null }) => {
  const { toast } = useToast();
  const { hasAnyRole } = useCurrentUserRoles();
  const { userId } = useAuthUserHex();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogOrigin, setDialogOrigin] = useState<PaymentOriginKey>('manual');

  const {
    notifications: allNotifications,
    isLoading,
    markAsRead,
  } = useNotificationsHex();

  const {
    state,
    alerts,
    getSummaryStats,
    loading,
    runChecks,
    acknowledgeAlert,
  } = useProjectManager();

  const allAlerts = state?.alerts || alerts || [];
  const stats = getSummaryStats();

  const paymentNotifications = useMemo(() => {
    return allNotifications
      .filter((n: any) =>
        [
          'payment_due',
          'payment_completed',
          'payment_failed',
          'payment_pending',
          'payment_blocked',
          'payment_warning',
        ].includes(n.type)
      )
      .slice(0, 10);
  }, [allNotifications]);

  const unreadCount = useMemo(() => {
    return paymentNotifications.filter((n: any) => !n.read).length;
  }, [paymentNotifications]);

  const canAccessPaymentControl = hasAnyRole(['admin', 'director', 'manager', 'agent']);

  const handleOpenNewPayment = (origin: PaymentOriginKey = 'manual') => {
    setDialogOrigin(origin);
    setIsDialogOpen(true);
  };

  const handlePaymentCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    toast({
      title: 'Paiement créé',
      description: 'La demande a été enregistrée avec succès.',
    });
    runChecks();
  };

  const getPaymentStatusIcon = (type: string) => {
    switch (type) {
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'payment_failed':
      case 'payment_blocked':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'payment_due':
      case 'payment_warning':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <CreditCard className="h-4 w-4 text-primary" />;
    }
  };

  const getPaymentStatusColor = (type: string) => {
    switch (type) {
      case 'payment_completed':
        return 'bg-success-soft text-success border-success/30';
      case 'payment_failed':
      case 'payment_blocked':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'payment_due':
      case 'payment_warning':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  if (!canAccessPaymentControl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <T
              k="auto.paymentcontrol.acces_restreint_vous_n_avez_pas_les_permissions_"
              fallback="Accès restreint. Vous n'avez pas les permissions nécessaires."
            />
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                <T
                  k="auto.paymentcontrol.controle_des_paiements"
                  fallback="Contrôle des Paiements"
                />
              </h1>
              <p className="text-muted-foreground mt-2">
                <T
                  k="auto.paymentcontrol.gestion_et_validation_des_paiements_avec_notific"
                  fallback="Gestion et validation des paiements avec notifications en temps réel"
                />
              </p>
            </div>
            <Button variant="outline" onClick={runChecks}>
              <T k="auto.paymentcontrol.actualiser" fallback="Actualiser" />
            </Button>
          </div>

          <Breadcrumb
            className="mb-4"
            items={[{ label: 'Finance' }, { label: 'Contrôle des Paiements' }]}
          />

          <Tabs defaultValue="surveillance" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="surveillance" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Surveillance &amp; Alertes</span>
                <span className="sm:hidden">
                  <T k="auto.paymentcontrol.alertes" fallback="Alertes" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="gestion" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">
                  <T
                    k="auto.paymentcontrol.gestion_des_paiements"
                    fallback="Gestion des Paiements"
                  />
                </span>
                <span className="sm:hidden">
                  <T k="auto.paymentcontrol.gestion" fallback="Gestion" />
                </span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>
                  <T k="auto.paymentcontrol.documents" fallback="Documents" />
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="surveillance" className="mt-6">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => handleOpenNewPayment('manual')}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nouvelle Demande / Paiement
                </Button>
              </div>

              <EnhancedPaymentBlockingInterface />

              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5" />
                    <h3 className="font-semibold">
                      <T
                        k="auto.paymentcontrol.notifications_de_paiement_recentes"
                        fallback="Notifications de paiement récentes"
                      />
                    </h3>
                    {unreadCount > 0 && (
                      <Badge variant="destructive">{unreadCount} nouveau(x)</Badge>
                    )}
                  </div>
                  {paymentNotifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      <T
                        k="auto.paymentcontrol.aucune_notification"
                        fallback="Aucune notification"
                      />
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {paymentNotifications.map((n: any) => (
                        <div
                          key={n.id}
                          className={`p-4 rounded-lg border ${
                            !n.read
                              ? 'border-l-4 border-l-primary bg-primary/10'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getPaymentStatusIcon(n.type)}
                                <h4 className="font-medium">{n.title}</h4>
                                {!n.read && (
                                  <Badge variant="secondary">
                                    <T k="auto.paymentcontrol.nouveau" fallback="Nouveau" />
                                  </Badge>
                                )}
                                <Badge className={getPaymentStatusColor(n.type)}>
                                  {n.type.replace('payment_', '').replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{n.message}</p>
                              {n.metadata?.payment_amount && (
                                <Badge variant="outline" className="text-success mt-2">
                                  {formatAmount2(n.metadata.payment_amount, '€')}
                                </Badge>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(n.created_at).toLocaleString('fr-FR')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(n.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Collapsible defaultOpen className="mt-6">
                <Card>
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-6 py-4 text-left">
                    <span className="flex items-center gap-2 font-semibold">
                      <SlidersHorizontal className="h-4 w-4" />
                      <T
                        k="auto.paymentcontrol.seuils_de_controle"
                        fallback="Seuils de contrôle"
                      />
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="grid gap-3 pt-0 md:grid-cols-2">
                      {PAYMENT_CONTROL_THRESHOLDS.map((threshold) => (
                        <div
                          key={threshold.key}
                          className="flex items-start justify-between gap-3 rounded-md border p-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  threshold.tone === 'critical'
                                    ? 'bg-destructive'
                                    : threshold.tone === 'high'
                                    ? 'bg-warning'
                                    : threshold.tone === 'warning'
                                    ? 'bg-warning/70'
                                    : 'bg-primary'
                                }`}
                              />
                              <span className="font-medium">{threshold.label}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {threshold.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {threshold.days === 0 ? 'Immédiat' : `≥ ${threshold.days} j`}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </TabsContent>

            <TabsContent value="gestion" className="mt-6">
              <FinancialDoctrineCard
                scope="project"
                entityId={project?.id}
                declaredBudget={(project as any)?.budget ?? 0}
                currency={(project as any)?.currency ?? 'MRU'}
                className="mb-6"
              />
              <PaymentCrud onCreatePayment={() => handleOpenNewPayment('manual')} />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <MonitoringDocumentsPanel scope="payment" />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <UnifiedPaymentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        origin={dialogOrigin}
        onCreated={handlePaymentCreated}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Page principale
// ────────────────────────────────────────────────────────────

const PaymentControlPage = () => {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [projectHierarchy, setProjectHierarchy] = useState<
    Array<{ id: string; name: string; level: number; positionTitle?: string }>
  >([]);

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjectsHex();

  /**
   * ✅ FIX : Éviter la boucle infinie
   * On ne définit plus `isLoading` en state. On dérive l'état de chargement
   * de `projectsLoading` + `selectedProject`.
   */
  const hasProjects = projects && projects.length > 0;

  // ✅ FIX : Utiliser une ref pour ne charger la hiérarchie qu'UNE SEULE FOIS par projet
  const loadedProjectIdRef = useRef<string | null>(null);

  const toISOStringSafe = useCallback(
    (date: string | Date | undefined | null): string => {
      if (!date) return new Date().toISOString();
      return typeof date === 'string' ? date : date.toISOString();
    },
    []
  );

  const loadProjectHierarchy = useCallback(
    async (projectId: string) => {
      // ✅ FIX : Éviter les appels en boucle
      if (loadedProjectIdRef.current === projectId) return;
      loadedProjectIdRef.current = projectId;

      try {
        const hierarchyRepository = RepositoryFactory.getHierarchyRepository();
        const hierarchy = await hierarchyRepository.getProjectHierarchy(projectId);
        setProjectHierarchy(hierarchy || []);
      } catch (error) {
        console.warn('[PaymentControlPage] Erreur chargement hiérarchie:', error);
        setProjectHierarchy([]);
      }
    },
    []
  );

  // ✅ FIX : Un seul useEffect, avec dépendances stables et condition d'arrêt
  useEffect(() => {
    // Cas 1 : pas encore de projets chargés → attendre
    if (projectsLoading) return;

    // Cas 2 : pas de projets du tout → ne rien faire (état vide géré au rendu)
    if (!hasProjects) return;

    // Cas 3 : projet déjà sélectionné → ne rien faire
    if (selectedProject) return;

    // Sélectionner le premier projet actif ou le premier par défaut
    const activeProject =
      projects.find((p) => String(p.status) === 'en cours') || projects[0];

    const projectData = {
      id: activeProject.id,
      title: activeProject.title,
      status: activeProject.status,
      progress: activeProject.progress || 0,
      budget: activeProject.budget || 0,
      startDate: toISOStringSafe(activeProject.startDate),
      endDate: toISOStringSafe(activeProject.endDate),
      teamSize: 0,
      description: activeProject.description || '',
      location: activeProject.location || '',
    } as unknown as ProjectData;

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

  // ✅ FIX : Reset propre si l'utilisateur change ou si les projets disparaissent
  useEffect(() => {
    if (!hasProjects && !projectsLoading) {
      setSelectedProject(null);
      setProjectHierarchy([]);
      loadedProjectIdRef.current = null;
    }
  }, [hasProjects, projectsLoading]);

  const buildEscalationRoles = useCallback((): EscalationRoles => {
    if (projectHierarchy.length === 0) {
      return {
        level1: 'employee',
        level2: 'supervisor',
        level3: 'manager',
        level4: 'director',
      };
    }

    const sorted = [...projectHierarchy].sort((a, b) => a.level - b.level);
    const levels = [...new Set(sorted.map((h) => h.level))].sort();

    const roles: EscalationRoles = {
      level1: 'employee',
      level2: 'supervisor',
      level3: 'manager',
      level4: 'director',
    };

    if (levels.length >= 1)
      roles.level4 =
        sorted.filter((h) => h.level === levels[0])[0]?.positionTitle || 'director';
    if (levels.length >= 2)
      roles.level3 =
        sorted.filter((h) => h.level === levels[1])[0]?.positionTitle || 'manager';
    if (levels.length >= 3)
      roles.level2 =
        sorted.filter((h) => h.level === levels[2])[0]?.positionTitle || 'supervisor';

    return roles;
  }, [projectHierarchy]);

  // ────────────────────────────────────────────────────────────
  // RENDU CONDITIONNEL
  // ────────────────────────────────────────────────────────────

  // 1. En cours de chargement des projets
  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            <T k="auto.paymentcontrol.chargement_du_projet" fallback="Chargement du projet..." />
          </p>
        </div>
      </div>
    );
  }

  // 2. Erreur de chargement
  if (projectsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <T
              k="auto.paymentcontrol.erreur_chargement_projets"
              fallback="Erreur lors du chargement des projets. Veuillez réessayer."
            />
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 3. Aucun projet disponible (démarrage à froid)
  if (!hasProjects) {
    return <NoProjectState />;
  }

  // 4. Projet en cours de sélection
  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            <T k="auto.paymentcontrol.chargement_du_projet" fallback="Chargement du projet..." />
          </p>
        </div>
      </div>
    );
  }

  // 5. Rendu normal
  return (
    <ProjectManagerProvider
      project={selectedProject}
      roles={buildEscalationRoles()}
      actionLabels={actionLabels}
    >
      <PaymentControlContent project={selectedProject} />
    </ProjectManagerProvider>
  );
};

export default PaymentControlPage;