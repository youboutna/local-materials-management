import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MapPin, Calendar, CheckSquare, ArrowRight, Users, BarChart3, AlertTriangle, Clock, Shield, TrendingUp } from 'lucide-react';
import WaterfallProjectManager from '@/components/project/WaterfallProjectManager';
import MonitoringDashboard from '@/components/dashboard/MonitoringDashboard';
import AlertsDashboard from '@/components/dashboard/AlertsDashboard';
import ManagementActions from '@/components/dashboard/ManagementActions';
import { Link } from 'react-router-dom';
import LoadDataButton from '@/components/LoadDataButton';
import { DEV_MODE } from '@/config/constants';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectProgressChart from '@/components/ProjectProgressChart';
import ProjectDistributionChart from '@/components/ProjectDistributionChart';
import ProjectMap from '@/components/ProjectMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { t } = useLanguage();
  const { projects } = useProjects();

  // Required roles for dashboard access (moved to constants)
  const allowedRoles = ['admin', 'director', 'project_manager'];

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        setHasAccess(false);
        return;
      }

      const userRoleNames = roles?.map(r => r.role_name) || [];
      setUserRoles(userRoleNames);
      
      // Check if user has required role
      const hasRequiredRole = userRoleNames.some(role => allowedRoles.includes(role));
      setHasAccess(hasRequiredRole);

      if (!hasRequiredRole) {
        toast({
          title: t('dashboard.access_denied_title'),
          description: t('dashboard.access_restricted'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  // State for real data
  const [realStats, setRealStats] = useState<{
    activeProjects: number;
    totalBudget: number;
    teamMembers: number;
    materials: number;
    phases: number;
    milestones: number;
    completedMilestones: number;
    statusDistribution: { name: string; value: number; color: string }[];
    locationDistribution: { name: string; count: number }[];
  }>({
    activeProjects: 0,
    totalBudget: 0,
    teamMembers: 0,
    materials: 0,
    phases: 0,
    milestones: 0,
    completedMilestones: 0,
    statusDistribution: [],
    locationDistribution: []
  });

  // Fetch real data from database
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        // Fetch projects data
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*');

        // Fetch phases data
        const { data: phasesData } = await supabase
          .from('project_phases')
          .select('*');

        // Fetch milestones data
        const { data: milestonesData } = await supabase
          .from('project_milestones')
          .select('*');

        // Fetch materials data
        const { data: materialsData } = await supabase
          .from('materials')
          .select('*');

        const activeProjects = projectsData?.filter(p => p.status === 'en cours').length || 0;
        const totalBudget = projectsData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        const teamMembers = projectsData?.reduce((sum, p) => sum + (p.team_size || 0), 0) || 0;
        const materials = materialsData?.length || 0;
        const phases = phasesData?.length || 0;
        const milestones = milestonesData?.length || 0;
        const completedMilestones = milestonesData?.filter(m => m.completion_date).length || 0;

        // Status distribution for pie chart
        const statusCounts = projectsData?.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Status colors moved to constants
        const statusColors = {
          'en cours': 'hsl(var(--primary))',
          'terminé': 'hsl(var(--success))',
          'en attente': 'hsl(var(--warning))', 
          'en inspection': 'hsl(var(--info))',
          'suspendu': 'hsl(var(--secondary))',
          'annulé': 'hsl(var(--destructive))'
        };

        const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
          name: status,
          value: count,
          color: statusColors[status as keyof typeof statusColors] || '#6b7280'
        }));

        // Location distribution for bar chart
        const locationCounts = projectsData?.reduce((acc, project) => {
          acc[project.location] = (acc[project.location] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        const locationDistribution = Object.entries(locationCounts).map(([location, count]) => ({
          name: location,
          count
        }));

        setRealStats({
          activeProjects,
          totalBudget,
          teamMembers,
          materials,
          phases,
          milestones,
          completedMilestones,
          statusDistribution,
          locationDistribution
        });
      } catch (error) {
        console.error('Error fetching real stats:', error);
      }
    };

    fetchRealStats();
  }, []);

  // Calculate statistics from projects data (fallback)
  const calculateStats = () => {
    if (!projects || projects.length === 0) {
      return realStats;
    }

    const activeProjects = projects.filter(p => p.status === 'en cours').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const teamMembers = projects.reduce((sum, p) => sum + p.teamSize, 0);

    return {
      ...realStats,
      activeProjects: realStats.activeProjects || activeProjects,
      totalBudget: realStats.totalBudget || totalBudget,
      teamMembers: realStats.teamMembers || teamMembers
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('dashboard.checking_permissions')}</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">{t('dashboard.access_denied_title')}</h2>
            <p className="text-red-600 mb-4">
              {t('dashboard.access_restricted')}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                <strong>{t('dashboard.your_roles')}:</strong> {userRoles.length > 0 ? userRoles.join(', ') : t('dashboard.no_role_assigned')}
              </p>
              <p className="text-sm text-red-600">
                <strong>{t('dashboard.required_roles_label')}:</strong> {allowedRoles.join(', ')}
              </p>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/projects')}
              variant="outline"
            >
              {t('dashboard.back_to_projects')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {t('dashboard.management_title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('dashboard.management_subtitle')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {t('dashboard.badges.roles_label')}: {userRoles.join(', ')}
                  </Badge>
                  {userRoles.includes('admin') && (
                    <Badge className="bg-red-500 text-white text-xs">{t('dashboard.badges.administrator')}</Badge>
                  )}
                  {userRoles.includes('director') && (
                    <Badge className="bg-blue-500 text-white text-xs">{t('dashboard.badges.director')}</Badge>
                  )}
                  {userRoles.includes('project_manager') && (
                    <Badge className="bg-green-500 text-white text-xs">{t('dashboard.badges.project_manager')}</Badge>
                  )}
                </div>
              </div>
              {DEV_MODE && (
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-md shadow-md text-sm">
                  🛠️ {t('dashboard.dev_mode')}
                </div>
              )}
            </div>
          </div>

          {/* Management Tabs */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Tabs defaultValue="actions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="actions">{t('dashboard.management_tabs.actions')}</TabsTrigger>
                <TabsTrigger value="overview">{t('dashboard.management_tabs.overview')}</TabsTrigger>
                <TabsTrigger value="monitoring">{t('dashboard.management_tabs.monitoring')}</TabsTrigger>
                <TabsTrigger value="alerts">{t('dashboard.management_tabs.alerts')}</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="mt-6">
                <ManagementActions />
              </TabsContent>

              <TabsContent value="overview" className="mt-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">{t('dashboard.cards.active_projects')}</CardTitle>
                        <CardDescription>{t('dashboard.cards.in_progress_description')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">{stats.activeProjects}</span>
                          <span className="ml-2 text-sm text-muted-foreground">{t('dashboard.cards.projects_label')}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium">{t('dashboard.cards.total_budget')}</CardTitle>
                        <CardDescription>{t('dashboard.cards.financial_resources')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline">
                          <span className="text-3xl font-bold">
                            {(stats.totalBudget / 1000000).toFixed(1)}M
                          </span>
                          <span className="ml-2 text-sm text-muted-foreground">MRU</span>
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
                          <ProjectProgressChart data={stats.statusDistribution} />
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
                          {projects && projects.slice(0, 3).map((project, i) => (
                            <div key={project.id} className="flex items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="bg-primary/10 p-2 rounded-md mr-3">
                                <CheckSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{project.title}</h4>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="mr-3">{project.location}</span>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
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
                        {stats.locationDistribution.length > 0 ? (
                          <ProjectDistributionChart data={stats.locationDistribution} />
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
                        {projects && projects.length > 0 ? (
                          <ProjectMap 
                            projects={projects}
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
                </motion.div>
              </TabsContent>

              <TabsContent value="monitoring" className="mt-6">
                <MonitoringDashboard />
              </TabsContent>

              <TabsContent value="alerts" className="mt-6">
                <AlertsDashboard />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;