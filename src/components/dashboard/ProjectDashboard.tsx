import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import LocationAutocomplete from '@/components/location/LocationAutocomplete';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  FileText,
  Settings,
  Activity,
  Building,
  MapPin,
  User,
  CreditCard,
  Shield,
  Truck,
  Package,
  Wrench
} from 'lucide-react';

// Import all project-related services
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectAnalyticsService } from '@/application/services/ProjectAnalyticsService';
import { ProjectCalculationService } from '@/application/services/ProjectCalculationService';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { ProjectManagerService } from '@/application/services/ProjectManagerService';

// Import all project-related hooks
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { useProjectAnalyticsHex } from '@/hooks/hexagonal/useProjectAnalyticsHex';
import { useProjectPhasesHex } from '@/hooks/hexagonal/useProjectPhasesHex';
import { useProjectMaterialsHex } from '@/hooks/hexagonal/useProjectMaterialsHex';
import { useProjectDetailHex } from '@/hooks/hexagonal/useProjectDetailHex';

// Import DTOs
import { 
  ProjectDTO, 
  ProjectStatus, 
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CATEGORIES 
} from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

interface ProjectDashboardProps {
  projectId?: string;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);

  // Project data hooks
  const { 
    data: projects, 
    isLoading: projectsLoading, 
    error: projectsError 
  } = useProjectsHex();

  const { 
    data: projectDetail, 
    isLoading: detailLoading 
  } = useProjectDetailHex(selectedProject);

  const { 
    data: analytics, 
    isLoading: analyticsLoading 
  } = useProjectAnalyticsHex(selectedProject);

  const { 
    data: phases, 
    isLoading: phasesLoading 
  } = useProjectPhasesHex(selectedProject);

  const { 
    data: materials, 
    isLoading: materialsLoading 
  } = useProjectMaterialsHex(selectedProject);

  // Calculate project statistics
  const projectStats = React.useMemo(() => {
    if (!projects) return null;

    const total = projects.length;
    const byStatus = projects.reduce((acc, project) => {
      const status = project.status as ProjectStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = Object.entries(PROJECT_STATUS_CATEGORIES).reduce((acc, [category, statuses]) => {
      acc[category] = statuses.filter(status => byStatus[status]).length;
      return acc;
    }, {} as Record<string, number>);

    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const avgProgress = projects.reduce((sum, project) => sum + (project.progress || 0), 0) / total;

    return {
      total,
      byStatus,
      byCategory,
      totalBudget,
      avgProgress: Math.round(avgProgress),
      activeProjects: byCategory.ACTIVE || 0,
      completedProjects: byCategory.COMPLETED || 0,
      problemProjects: byCategory.PROBLEM || 0
    };
  }, [projects]);

  // Chart data
  const statusChartData = React.useMemo(() => {
    if (!projectStats?.byStatus) return [];
    return Object.entries(projectStats.byStatus).map(([status, count]) => ({
      name: PROJECT_STATUS_LABELS[status as ProjectStatus] || status,
      value: count,
      color: getStatusColor(status as ProjectStatus)
    }));
  }, [projectStats]);

  const categoryChartData = React.useMemo(() => {
    if (!projectStats?.byCategory) return [];
    return Object.entries(projectStats.byCategory).map(([category, count]) => ({
      name: category,
      value: count,
      color: getCategoryColor(category)
    }));
  }, [projectStats]);

  const progressChartData = React.useMemo(() => {
    if (!projects) return [];
    return projects.slice(0, 10).map(project => ({
      name: project.title?.substring(0, 20) || 'Unknown',
      progress: project.progress || 0,
      budget: project.budget || 0
    }));
  }, [projects]);

  // Helper functions
  function getStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.COMPLETED:
      case ProjectStatus.TERMINE:
        return '#10b981';
      case ProjectStatus.EN_COURS:
      case ProjectStatus.EN_CONSTRUCTION:
        return '#3b82f6';
      case ProjectStatus.EN_RETARD:
      case ProjectStatus.SUSPENDU:
        return '#f59e0b';
      case ProjectStatus.ANNULE:
      case ProjectStatus.CANCELLED:
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case 'INITIAL':
        return '#e5e7eb';
      case 'ACTIVE':
        return '#3b82f6';
      case 'REVIEW':
        return '#f59e0b';
      case 'COMPLETED':
        return '#10b981';
      case 'PROBLEM':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getStatusIcon(status: ProjectStatus) {
    switch (status) {
      case ProjectStatus.COMPLETED:
      case ProjectStatus.TERMINE:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ProjectStatus.EN_COURS:
      case ProjectStatus.EN_CONSTRUCTION:
        return <Activity className="h-4 w-4 text-blue-500" />;
      case ProjectStatus.EN_RETARD:
      case ProjectStatus.SUSPENDU:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case ProjectStatus.ANNULE:
      case ProjectStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (projectsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load project data: {projectsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Management Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of all projects and their performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {projectStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{projectStats.total}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold text-blue-600">{projectStats.activeProjects}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{projectStats.completedProjects}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold">{projectStats.avgProgress}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={projectStats.avgProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Location Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <LocationAutocomplete
                    value=""
                    onChange={(address, locationData) => {
                      // Handle location search
                      console.log('Dashboard location search:', address, locationData);
                      // Could filter projects by location here
                    }}
                    placeholder="Rechercher des projets par localisation..."
                    filter="all"
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    <p>Recherchez des projets par région, ville ou adresse spécifique.</p>
                    <p className="text-xs mt-1">
                      Supporte la recherche en français et en arabe.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects?.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(project.status as ProjectStatus)}
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">{project.location}</p>
                        {project.regionCode && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {project.regionCode}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {PROJECT_STATUS_LABELS[project.status as ProjectStatus] || project.status}
                      </Badge>
                      <div className="mt-1">
                        <Progress value={project.progress || 0} className="w-24 h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects?.map((project) => (
                  <div 
                    key={project.id} 
                    className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(project.status as ProjectStatus)}
                        <div>
                          <h4 className="font-semibold">{project.title}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.location}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {project.start_date}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {project.budget?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {PROJECT_STATUS_LABELS[project.status as ProjectStatus] || project.status}
                        </Badge>
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground">Progress</div>
                          <Progress value={project.progress || 0} className="w-32 h-2 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {selectedProject && analytics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="progress" stroke="#3b82f6" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="budget" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a project to view analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-6">
          {selectedProject && phases ? (
            <Card>
              <CardHeader>
                <CardTitle>Project Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase) => (
                    <div key={phase.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{phase.phase_name}</h4>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{phase.status}</Badge>
                          <div className="mt-2">
                            <Progress value={phase.progress || 0} className="w-24 h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a project to view phases</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {selectedProject && materials ? (
            <Card>
              <CardHeader>
                <CardTitle>Project Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materials.map((material) => (
                    <div key={material.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Package className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-semibold">{material.name}</h4>
                            <p className="text-sm text-muted-foreground">{material.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{material.quantity} {material.unit}</div>
                          <div className="text-sm text-muted-foreground">{material.unit_price} per unit</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Select a project to view resources</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Progress Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Financial Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Resource Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  <span>Milestone Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <span>Risk Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Quality Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
