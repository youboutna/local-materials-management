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
import { buildLocationDistribution, getProjectCoordinates } from "@/utils/projectLocationBuckets";
import { formatAmount2, formatNumber2 } from "@/utils/reportNumbers";
import { T } from '@/components/i18n/T';


/** Rôles autorisés sur le tableau de bord de gestion (codes techniques). */
const REQUIRED_DASHBOARD_ROLES = ['admin', 'director', 'project_manager'] as const;

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
      status: p.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
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

  // Compute location distribution from hexProjects as fallback
  const locationDistributionFromProjects = useMemo(() => {
    return buildLocationDistribution(hexProjects);
  }, [hexProjects]);

  // Use stats from hexagonal dashboard hook with safe defaults
  const stats = useMemo(() => {
    const baseStats = {
      activeProjects: dashboardStats?.activeProjects ?? hexProjects.filter(p => {
        const s = String(p.status);
        return s === 'en cours' || s === 'in_progress' || s === 'en_cours_v2' || s === 'enCours';
      }).length,
      totalBudget: dashboardStats?.totalBudget ?? 0,
      teamMembers: dashboardStats?.totalEmployees ?? 0,
      materials: dashboardStats?.totalMaterials ?? 0,
      statusDistribution: dashboardStats?.statusDistribution ?? [],
      locationDistribution: (dashboardStats?.locationDistribution && dashboardStats.locationDistribution.length > 0) 
        ? dashboardStats.locationDistribution 
        : locationDistributionFromProjects,
    };
    return baseStats;
  }, [dashboardStats, hexProjects, locationDistributionFromProjects]);

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

            <TabsContent value="overview" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
               
                {/* TBI — Tableau de bord des indicateurs (référentiel indicator-templates) */}
                <TBIWidget projects={hexProjects as any} />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">
                        {t("dashboard.cards.active_projects")}
                      </CardTitle>
                      <CardDescription>
                        {t("dashboard.cards.in_progress_description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">
                          {stats.activeProjects}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t("dashboard.cards.projects_label")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">
                        {t("dashboard.cards.total_budget")}
                      </CardTitle>
                      <CardDescription>
                        {t("dashboard.cards.financial_resources")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">
                          {formatNumber2(stats.totalBudget)}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          <T k="auto.dashboard.mru" fallback="MRU" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">{t('dashboard.cards.teams')}</CardTitle>
                      <CardDescription>{t('dashboard.cards.staff_assigned')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{stats.teamMembers}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{t('dashboard.cards.members_label')}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">{t('dashboard.cards.materials_title')}</CardTitle>
                      <CardDescription>{t('dashboard.cards.available_resources')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{stats.materials}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{t('dashboard.cards.types_label')}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Project List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        {t('dashboard.cards.project_progress')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      {stats.statusDistribution.length > 0 ? (
                        <ProjectProgressChart
                          data={stats.statusDistribution}
                        />
                      ) : (
                        <div className="h-full w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_data')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-xl">
                        <div className="flex items-center">
                          <CheckSquare className="h-5 w-5 mr-2" />
                          {t('dashboard.recent_projects')}
                        </div>
                        <Link to="/projects">
                          <Button variant="ghost" size="sm" className="-mr-2">
                            <span className="text-xs mr-1">{t('dashboard.view_all')}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {projects &&
                          projects.slice(0, 3).map((project) => (
                            <div
                              key={project.id}
                              className="flex items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="bg-primary/10 p-2 rounded-md mr-3">
                                <CheckSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {project.title}
                                </h4>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="mr-3">
                                    {project.location}
                                  </span>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {new Date(
                                      project.startDate
                                    ).toLocaleDateString("fr-FR", {
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        {(!projects || projects.length === 0) && (
                          <div className="text-center py-4 text-muted-foreground">
                            {t('dashboard.no_projects')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Map and Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <Users className="h-5 w-5 mr-2" />
                        {t('dashboard.distribution_by_region')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.locationDistribution && stats.locationDistribution.length > 0 ? (
                        <ProjectDistributionChart
                          data={stats.locationDistribution}
                        />
                      ) : (
                        <div className="h-64 w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_data')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <MapPin className="h-5 w-5 mr-2" />
                        {t('dashboard.project_distribution')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      {projects && projects.length > 0 ? (() => {
                        const geolocatedCount = projects.filter((project) =>
                          Boolean(getProjectCoordinates(project)),
                        ).length;
                        console.info('[Dashboard] map rendered', geolocatedCount, 'locations for', projects.length, 'projects');
                        return (
                          <ProjectMap
                            projects={projects as unknown as import('@/dtos/entities/ProjectDTO').ProjectDTO[]}
                            defaultCenter={[20.5279, -10.0309]}
                            defaultZoom={6}
                            height="100%"
                            className="h-full rounded-lg"
                          />
                        );
                      })() : (
                        <div className="h-full w-full bg-muted/20 flex items-center justify-center rounded-lg border border-dashed">
                          <span className="text-muted-foreground text-sm font-medium">{t('dashboard.no_geolocated_projects')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
