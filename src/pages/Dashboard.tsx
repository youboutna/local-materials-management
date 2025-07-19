import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, CheckSquare, ArrowRight, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LoadDataButton from '@/components/LoadDataButton';
import { DEV_MODE } from '@/config/constants';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectProgressChart from '@/components/ProjectProgressChart';
import ProjectDistributionChart from '@/components/ProjectDistributionChart';
import ProjectMap from '@/components/ProjectMap';
import { useLanguage } from '@/contexts/LanguageContext';

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

  // Calculate statistics from projects data
  const calculateStats = () => {
    if (!projects || projects.length === 0) {
      return {
        activeProjects: 0,
        totalBudget: 0,
        teamMembers: 0,
        materials: 0,
        statusDistribution: [],
        locationDistribution: []
      };
    }

    const activeProjects = projects.filter(p => p.status === 'en cours').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const teamMembers = projects.reduce((sum, p) => sum + p.teamSize, 0);

    // Status distribution for pie chart
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
    const locationCounts = projects.reduce((acc, project) => {
      acc[project.location] = (acc[project.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationDistribution = Object.entries(locationCounts).map(([location, count]) => ({
      name: location,
      count
    }));

    return {
      activeProjects,
      totalBudget,
      teamMembers,
      materials: 12, // Static for now
      statusDistribution,
      locationDistribution
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
        </div>
      </main>
      
      
    </div>
  );
};

export default Dashboard;
