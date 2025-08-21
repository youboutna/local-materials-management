import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, CheckSquare, ArrowRight, Users, BarChart3 } from 'lucide-react';
import WaterfallProjectManager from '@/components/project/WaterfallProjectManager';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LoadDataButton from '@/components/LoadDataButton';
import { DEV_MODE } from '@/config/constants';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectProgressChart from '@/components/ProjectProgressChart';
import ProjectDistributionChart from '@/components/ProjectDistributionChart';
import ProjectMap from '@/components/ProjectMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { t } = useLanguage();

  const navigate = useNavigate();
  const { user, isDevelopmentMode } = useAuth();
  const { toast } = useToast();
  const { projects, loading } = useProjects();

  useEffect(() => {
    if (!user && !isDevelopmentMode) {
      navigate('/auth?mode=login');
      toast({
        title: "Accès restreint",
        description: "Veuillez vous connecter pour accéder au tableau de bord.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast, isDevelopmentMode]);

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

        const statusColors = {
          'en cours': '#3b82f6',
          'terminé': '#10b981',
          'en attente': '#f59e0b',
          'en inspection': '#eab308',
          'suspendu': '#8b5cf6',
          'annulé': '#ef4444'
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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">{t('dashboard.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {isDevelopmentMode && (
        <div className="fixed top-20 right-4 z-50 bg-amber-100 text-amber-800 px-4 py-2 rounded-md shadow-md text-sm">
          🛠️ {t('dashboard.dev_mode')}
        </div>
      )}
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.h1 
            className="text-3xl font-bold text-adrar-900 font-serif mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('dashboard.title')}
          </motion.h1>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-terracotta-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">{t('dashboard.active_projects')}</CardTitle>
                <CardDescription>{t('dashboard.status_overview')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{stats.activeProjects}</span>
                  <span className="ml-2 text-sm text-gray-500">{t('dashboard.active_projects_label')}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-adrar-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">{t('dashboard.total_budget')}</CardTitle>
                <CardDescription>{t('dashboard.financial_resources')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">
                    {(stats.totalBudget / 1000000).toFixed(1)}M
                  </span>
                  <span className="ml-2 text-sm text-gray-500">MRU</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-sandstone-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">{t('dashboard.team')}</CardTitle>
                <CardDescription>{t('dashboard.project_staff')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{stats.teamMembers}</span>
                  <span className="ml-2 text-sm text-gray-500">{t('dashboard.members')}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">{t('dashboard.materials')}</CardTitle>
                <CardDescription>{t('dashboard.available_resources')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{stats.materials}</span>
                  <span className="ml-2 text-sm text-gray-500">{t('dashboard.types')}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Stats Row */}
          {/* Waterfall KPIs Row */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Phases Waterfall</CardTitle>
                <CardDescription>Phases séquentielles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{stats.phases}</span>
                  <span className="ml-2 text-sm text-gray-500">phases</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Jalons Gantt</CardTitle>
                <CardDescription>Jalons planifiés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{stats.milestones}</span>
                  <span className="ml-2 text-sm text-gray-500">jalons</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Marchés Publics</CardTitle>
                <CardDescription>Étapes workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">5</span>
                  <span className="ml-2 text-sm text-gray-500">étapes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Délais</CardTitle>
                <CardDescription>Respect planning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">{Math.round((stats.completedMilestones / Math.max(stats.milestones, 1)) * 100)}</span>
                  <span className="ml-2 text-sm text-gray-500">%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-teal-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">CPI/SPI</CardTitle>
                <CardDescription>Performance index</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">1.2</span>
                  <span className="ml-2 text-sm text-gray-500">index</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <BarChart3 className="h-5 w-5 mr-2 text-terracotta-600" />
                  {t('dashboard.project_progress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {stats.statusDistribution.length > 0 ? (
                  <ProjectProgressChart data={stats.statusDistribution} />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-terracotta-100 to-white flex items-center justify-center rounded-lg border border-dashed border-terracotta-300">
                    <span className="text-terracotta-400 text-sm font-medium">{t('dashboard.no_data')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl font-serif">
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-terracotta-600" />
                    {t('dashboard.recent_projects')}
                  </div>
                  <Link to="/projects">
                    <Button variant="ghost" size="sm" className="text-terracotta-600 hover:text-terracotta-700 -mr-2">
                      <span className="text-xs mr-1">{t('dashboard.view_all')}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects && projects.slice(0, 3).map((project, i) => (
                    <div key={project.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="bg-terracotta-100 p-2 rounded-md mr-3">
                        <CheckSquare className="h-5 w-5 text-terracotta-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-adrar-800">{project.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="mr-3">{project.location}</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(project.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!projects || projects.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      {t('dashboard.no_projects')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <Users className="h-5 w-5 mr-2 text-adrar-600" />
                  {t('dashboard.distribution_by_region')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.locationDistribution.length > 0 ? (
                  <ProjectDistributionChart data={stats.locationDistribution} />
                ) : (
                  <div className="h-64 w-full bg-gradient-to-br from-adrar-100 to-white flex items-center justify-center rounded-lg border border-dashed border-adrar-300">
                    <span className="text-adrar-400 text-sm font-medium">{t('dashboard.no_data')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <MapPin className="h-5 w-5 mr-2 text-adrar-600" />
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
                  <div className="h-full w-full bg-gradient-to-br from-adrar-100 to-white flex items-center justify-center rounded-lg border border-dashed border-adrar-300">
                    <span className="text-adrar-400 text-sm font-medium">{t('dashboard.no_geolocated_projects')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Waterfall Management Tabs */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="waterfall">Gestion Waterfall</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                <TabsTrigger value="alerts">Alertes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé des Projets</CardTitle>
                    <CardDescription>Vue d'ensemble des statistiques principales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Consultez les graphiques ci-dessus pour un aperçu complet de vos projets.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="waterfall" className="mt-6">
                <WaterfallProjectManager />
              </TabsContent>

              <TabsContent value="monitoring" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monitoring des Projets</CardTitle>
                    <CardDescription>Suivi en temps réel des performances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Module de monitoring en développement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alertes et Notifications</CardTitle>
                    <CardDescription>Gestion des alertes de projet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Système d'alertes en développement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
