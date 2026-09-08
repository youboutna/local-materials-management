import AlertsDashboard from "@/components/dashboard/AlertsDashboard";
import KPIDashboardWidget from "@/components/dashboard/KPIDashboardWidget";
import ManagementActions from "@/components/dashboard/ManagementActions";
import TBIWidget from "@/components/dashboard/TBIWidget";
import ProjectDistributionChart from "@/components/ProjectDistributionChart";
import ProjectMap from "@/components/ProjectMap";
import ProjectProgressChart from "@/components/ProjectProgressChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEV_MODE } from "@/config/constants";
import { useLanguage } from "@/contexts/LanguageContext";
import { useI18n } from "@/hooks/useI18n";

import { useDashboardHex, useProjectsHex, useAuthUserHex, useDashboardAccessHex } from "@/hooks/hexagonal";
import { useCurrentUserRoles } from "@/hooks/useUserRoles";
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckSquare,
  MapPin,
  Shield,
  Users,
  RefreshCw,
  LayoutDashboard,
  ListTodo,
  Bell
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { getProjectCoordinates } from "@/utils/projectLocationBuckets";
import { formatAmount2, formatNumber2 } from "@/utils/reportNumbers";
import { T } from '@/components/i18n/T';


/** Rôles autorisés sur le tableau de bord de gestion (codes techniques). */
const REQUIRED_DASHBOARD_ROLES = ['admin', 'director', 'project_manager'] as const;

/** Couleur d'avancement : rouge = retard, orange = attention, vert = conforme. */
const progressTone = (progress: number): string => {
  if (progress < 35) return 'bg-destructive';
  if (progress < 70) return 'bg-warning';
  return 'bg-success';
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { translateRole } = useI18n();
  
  // Use the original AuthContext
  const { user, session } = useAuth();
  const { userRoles, hasAnyRole, hasRole } = useCurrentUserRoles();
  
  // Check if user has access to dashboard (admin, director, or project_manager)
  const hasAccess = hasAnyRole([...REQUIRED_DASHBOARD_ROLES]);

  
  // Use hexagonal architecture hooks for data
  const { projects: hexProjects } = useProjectsHex();
  const { stats: dashboardStats, loading: statsLoading } = useDashboardHex();
  

  // Map domain entities to projects for compatibility with ProjectData
  const projects = useMemo(() => 
    hexProjects.map(p => {
      const coordinates = getProjectCoordinates(p);
      return {
      ...p,
      description: p.description || '',
      location: p.location || '',
      status: p.status as unknown as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
      progress: p.progress,
      budget: p.budget,
      teamSize: p.teamSize || 0,
      startDate: p.startDate ? new Date(p.startDate).toISOString() : new Date().toISOString(),
      endDate: p.endDate ? new Date(p.endDate).toISOString() : new Date().toISOString(),
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      coordinates,
    }})
  , [hexProjects]);

  // DashboardService is the single source for aggregates. A missing aggregate
  // remains unavailable instead of being replaced by a synthetic zero.
  const stats = useMemo(() => {
    const unavailable = new Set(dashboardStats?.unavailableSources ?? []);
    const baseStats = {
      activeProjects: unavailable.has('projects') ? null : dashboardStats?.activeProjects ?? null,
      totalBudget: unavailable.has('projects') ? null : dashboardStats?.totalBudget ?? null,
      teamMembers: unavailable.has('employees') ? null : dashboardStats?.totalEmployees ?? null,
      materials: unavailable.has('materials') ? null : dashboardStats?.totalMaterials ?? null,
      statusDistribution: unavailable.has('projects') ? [] : dashboardStats?.statusDistribution ?? [],
      locationDistribution: unavailable.has('projects') ? [] : dashboardStats?.locationDistribution ?? [],
    };
    return baseStats;
  }, [dashboardStats]);

  /** Vision décideur : les 4 indicateurs clés tiennent sur une seule ligne. */
  const kpiCards = useMemo(
    () => [
      {
        label: t('dashboard.cards.active_projects'),
        value: stats.activeProjects ?? t('dashboard.kpi.not_evaluable'),
        unit: t('dashboard.cards.projects_label'),
        accent: 'border-l-primary',
      },
      {
        label: t('dashboard.cards.total_budget'),
        value: stats.totalBudget == null ? t('dashboard.kpi.not_evaluable') : formatNumber2(stats.totalBudget),
        unit: 'MRU',
        accent: 'border-l-success',
      },
      {
        label: t('dashboard.cards.teams'),
        value: stats.teamMembers ?? t('dashboard.kpi.not_evaluable'),
        unit: t('dashboard.cards.members_label'),
        accent: 'border-l-info',
      },
      {
        label: t('dashboard.cards.materials_title'),
        value: stats.materials ?? t('dashboard.kpi.not_evaluable'),
        unit: t('dashboard.cards.types_label'),
        accent: 'border-l-warning',
      },
    ],
    [stats, t],
  );

  /** Projets les moins avancés d'abord : ce sont les points d'attention. */
  const topProjects = useMemo(
    () => [...projects].sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0)).slice(0, 6),
    [projects],
  );

  /** Répartition par statut convertie en barres proportionnelles. */
  const statusBars = useMemo(() => {
    const rows = (stats.statusDistribution ?? []) as Array<{ name?: string; status?: string; value?: number; count?: number }>;
    const entries = rows.map((row) => ({
      name: row.name ?? row.status ?? '',
      value: row.value ?? row.count ?? 0,
    }));
    const max = Math.max(1, ...entries.map((e) => e.value));
    return entries.map((e) => ({ ...e, percent: Math.round((e.value / max) * 100) }));
  }, [stats.statusDistribution]);


  if (statsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {t("dashboard.loading_stats")}
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              {t("dashboard.access_denied_title")}
            </h2>
            <p className="text-destructive mb-4">
              {t("dashboard.access_restricted")}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                <strong>{t("dashboard.your_roles")}:</strong>{" "}
                {userRoles.length > 0
                  ? userRoles.map((role) => translateRole(role)).join(", ")
                  : t("dashboard.no_role_assigned")}
              </p>
              <p className="text-sm text-destructive">
                <strong>{t("dashboard.required_roles_label")}:</strong>{" "}
                {REQUIRED_DASHBOARD_ROLES.map((role) => translateRole(role)).join(", ")}
              </p>
            </div>

            <Button
              className="mt-4"
              onClick={() => navigate("/projects")}
              variant="outline"
            >
              {t("dashboard.back_to_projects")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dashboardActions = (
    <>
      {DEV_MODE && (
        <Badge variant="outline" className="bg-warning/10 text-warning">
          🛠️ DEV MODE
        </Badge>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link to="/monitoring">
          <BarChart3 className="h-4 w-4 mr-2" />
          <T k="auto.dashboard.centre_de_surveillance" fallback="Centre de Surveillance" />
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
        <RefreshCw className="h-4 w-4 mr-2" />
        {t("common.refresh") || "Actualiser"}
      </Button>
    </>
  );

  return (
    <>
      <AppLayout
        showBreadcrumb
        pageTitle={t("dashboard.management_title")}
        pageDescription={t("dashboard.management_subtitle")}
        actions={dashboardActions}
      >
      <div className="space-y-6">
        {/* Role Badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t("dashboard.badges.roles_label")}: {userRoles.map((role) => translateRole(role)).join(", ")}
          </Badge>
          {userRoles.includes("admin") && (
            <Badge className="bg-destructive text-destructive-foreground text-xs">
              {t("dashboard.badges.administrator")}
            </Badge>
          )}
          {userRoles.includes("director") && (
            <Badge className="bg-info text-info-foreground text-xs">
              {t("dashboard.badges.director")}
            </Badge>
          )}
          {userRoles.includes("project_manager") && (
            <Badge className="bg-success text-success-foreground text-xs">
              {t("dashboard.badges.project_manager")}
            </Badge>
          )}
        </div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.management_tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline"><T k="auto.dashboard.monitoring" fallback="Monitoring" /></span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.management_tabs.actions')}</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard.management_tabs.alerts.label')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* 1. Indicateurs clés — une seule ligne, visibles sans défilement */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {kpiCards.map((kpi) => (
                    <Card key={kpi.label} className={`border-l-4 ${kpi.accent}`}>
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold leading-tight">{kpi.value}</span>
                          <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 2. Zone stratégique — répartition géographique + avancement côte à côte */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <Card className="lg:col-span-2">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="flex items-center text-base">
                        <Users className="h-4 w-4 mr-2" />
                        {t('dashboard.distribution_by_region')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {stats.locationDistribution && stats.locationDistribution.length > 0 ? (
                        <ProjectDistributionChart data={stats.locationDistribution} />
                      ) : (
                        <div className="h-52 w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_data')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-3">
                    <CardHeader className="flex-row items-center justify-between p-3 pb-1">
                      <CardTitle className="flex items-center text-base">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {t('dashboard.cards.project_progress')}
                      </CardTitle>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/projects">
                          <span className="text-xs mr-1">{t('dashboard.view_all')}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {topProjects.length > 0 ? (
                        <div className="space-y-2">
                          {topProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => navigate(`/projects/${project.id}`)}
                              className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="truncate">{project.title}</span>
                                <span className="font-medium tabular-nums">{formatNumber2(project.progress ?? 0)}%</span>
                              </div>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                <div
                                  className={`h-1.5 rounded-full ${progressTone(project.progress ?? 0)}`}
                                  style={{ width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%` }}
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="h-52 w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_projects')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 3. Répartition par statut — barres proportionnelles */}
                <Card>
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="flex items-center text-base">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      {t('dashboard.project_distribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {statusBars.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {statusBars.map((bar) => (
                          <div key={bar.name}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate">{bar.name}</span>
                              <span className="font-medium tabular-nums">{bar.value}</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${bar.percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('dashboard.no_data')}</span>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Détails opérationnels — sous la ligne de flottaison */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="flex items-center text-base">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {t('dashboard.recent_projects')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="space-y-2">
                        {projects.slice(0, 5).map((project) => (
                          <div key={project.id} className="rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                            <p className="text-sm font-medium truncate">{project.title}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-0.5 gap-2">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{project.location}</span>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(project.startDate).toLocaleDateString('fr-FR', {
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {projects.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">{t('dashboard.no_projects')}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="flex items-center text-base">
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('dashboard.project_distribution')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72 p-3 pt-0">
                      {projects.length > 0 ? (
                        <ProjectMap
                          projects={projects as unknown as import('@/dtos/entities/ProjectDTO').ProjectDTO[]}
                          defaultCenter={[20.5279, -10.0309]}
                          defaultZoom={6}
                          height="100%"
                          className="h-full rounded-lg"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_geolocated_projects')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* TBI — indicateurs détaillés, hors zone de décision immédiate */}
                <TBIWidget projects={hexProjects as any} />
              </motion.div>
            </TabsContent>


            <TabsContent value="monitoring" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      <T k="auto.dashboard.centre_de_surveillance" fallback="Centre de Surveillance" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-24 flex-col" asChild>
                        <Link to="/monitoring">
                          <Shield className="h-8 w-8 mb-2" />
                          <span><T k="auto.dashboard.vue_complete" fallback="Vue Complète" /></span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col" asChild>
                        <Link to="/bank-guarantee-monitor">
                          <BarChart3 className="h-8 w-8 mb-2" />
                          <span><T k="auto.dashboard.garanties_bancaires" fallback="Garanties Bancaires" /></span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col" asChild>
                        <Link to="/payment-control">
                          <Calendar className="h-8 w-8 mb-2" />
                          <span><T k="auto.dashboard.controle_paiements" fallback="Contrôle Paiements" /></span>
                        </Link>
                      </Button>
                      <Button variant="outline" className="h-24 flex-col" asChild>
                        <Link to="/insurance-management">
                          <Shield className="h-8 w-8 mb-2" />
                          <span><T k="auto.dashboard.assurances" fallback="Assurances" /></span>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <KPIDashboardWidget />
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-6">
              <ManagementActions />
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              <AlertsDashboard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      </AppLayout>
    </>
  );
};

export default Dashboard;
