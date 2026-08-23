import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UnifiedLocationSelector from '@/components/location/UnifiedLocationSelector';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building, 
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
  MapPin,
  User,
  CreditCard,
  Shield,
  Truck,
  Package,
  Wrench,
  Plus,
  Edit,
  Trash2,
  Archive,
  RefreshCw,
  Download,
  Search,
  Filter
} from 'lucide-react';

// Import hooks and services
import { 
  useProjects,
  useProjectOverview,
  useProjectDetail,
  useProjectMetrics,
  useProjectWorkflow,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useUpdateProjectStatus,
  useBulkProjectOperations,
  useProjectSearch,
  useProjectStatistics,
  useProjectWorkflowManager
} from '@/hooks/hexagonal/useProjectManagementHex';

// Import DTOs
import { 
  ProjectStatus, 
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_CATEGORIES 
} from '@/dtos/entities/ProjectDTO';
import { T } from '@/components/i18n/T';

// ProjectDashboard placeholder - component will be created separately
const ProjectDashboard: React.FC<any> = () => <div><T k="auto.projectmanagementpage.project_dashboard" fallback="Project Dashboard" /></div>;
import { Skeleton } from '../ui/skeleton';

import { TranslatedSeverity, TranslatedStatus } from '@/components/i18n/TranslatedBadges';
/**
 * Comprehensive Project Management Page
 * Implements all project-related services with data-driven UI
 */
const ProjectManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // Hooks
  const projectsQuery = useProjects({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    category: categoryFilter.length > 0 ? categoryFilter : undefined
  });
  const projects = (projectsQuery as any).projects || (projectsQuery as any).data || [];
  const projectsLoading = projectsQuery.isLoading;
  const projectsError = projectsQuery.error;

  const { 
    data: projectOverview, 
    isLoading: overviewLoading 
  } = useProjectOverview(projectId || '');

  const { 
    data: projectDetail, 
    isLoading: detailLoading 
  } = useProjectDetail(projectId || '');

  const { 
    data: metrics, 
    isLoading: metricsLoading 
  } = useProjectMetrics();

  const { 
    data: workflow, 
    isLoading: workflowLoading 
  } = useProjectWorkflow(projectId || '');

  const { 
    projects: filteredProjects, 
    isLoading: searchLoading,
    filters,
    updateFilters,
    clearFilters 
  } = useProjectSearch();

  const statisticsQuery = useProjectStatistics();
  const statistics = (statisticsQuery as any).statistics || (statisticsQuery as any).data || null;

  const { 
    advanceWorkflow, 
    blockWorkflow 
  } = useProjectWorkflowManager(projectId || '');

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const updateStatus = useUpdateProjectStatus();
  const { bulkUpdateStatus, bulkArchive } = useBulkProjectOperations();

  // Update search and filters
  useEffect(() => {
    updateFilters({
      status: statusFilter.length > 0 ? statusFilter : undefined,
      category: categoryFilter.length > 0 ? categoryFilter : undefined
    });
  }, [statusFilter, categoryFilter, updateFilters]);

  // Handle project selection
  const handleProjectSelect = (projectId: string, selected: boolean) => {
    if (selected) {
      setSelectedProjects(prev => [...prev, projectId]);
    } else {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    }
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === projects?.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects?.map(p => p.id) || []);
    }
  };

  // Handle bulk actions
  const handleBulkStatusUpdate = (status: ProjectStatus) => {
    if (selectedProjects.length === 0) return;
    
    bulkUpdateStatus.mutateAsync({
      projectIds: selectedProjects,
      status,
      reason: `Bulk status update to ${PROJECT_STATUS_LABELS[status]}`
    });
  };

  const handleBulkArchive = () => {
    if (selectedProjects.length === 0) return;
    
    bulkArchive.mutateAsync(selectedProjects);
  };

  // Status options for filtering
  const statusOptions = Object.values(ProjectStatus).map(status => ({
    value: status,
    label: PROJECT_STATUS_LABELS[status]
  }));

  // Category options for filtering
  const categoryOptions = Object.keys(PROJECT_STATUS_CATEGORIES).map(category => ({
    value: category,
    label: category.charAt(0) + category.slice(1).toLowerCase()
  }));

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold"><T k="auto.projectmanagementpage.project_management" fallback="Project Management" /></h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              <T k="auto.projectmanagementpage.refresh" fallback="Refresh" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <T k="auto.projectmanagementpage.new_project" fallback="New Project" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projectsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load projects: {projectsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold"><T k="auto.projectmanagementpage.project_management" fallback="Project Management" /></h1>
          <p className="text-muted-foreground">
            <T k="auto.projectmanagementpage.manage_all_your_construction_projects_efficientl" fallback="Manage all your construction projects efficiently" />
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/projects/create')}>
            <Plus className="h-4 w-4 mr-2" />
            <T k="auto.projectmanagementpage.new_project" fallback="New Project" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowBulkActions(true)}
            disabled={selectedProjects.length === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            <T k="auto.projectmanagementpage.bulk_actions" fallback="Bulk Actions" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            <T k="auto.projectmanagementpage.export" fallback="Export" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter[0] || ''} onValueChange={(value) => 
                value ? setStatusFilter([value as ProjectStatus]) : setStatusFilter([])
              }>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <T k="auto.projectmanagementpage.status" fallback="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""><T k="auto.projectmanagementpage.all_statuses" fallback="All Statuses" /></SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter[0] || ''} onValueChange={(value) => 
                value ? setCategoryFilter([value]) : setCategoryFilter([])
              }>
                <SelectTrigger className="w-40">
                  <Target className="h-4 w-4 mr-2" />
                  <T k="auto.projectmanagementpage.category" fallback="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""><T k="auto.projectmanagementpage.all_categories" fallback="All Categories" /></SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                <T k="auto.projectmanagementpage.clear_filters" fallback="Clear Filters" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground"><T k="auto.projectmanagementpage.total_projects" fallback="Total Projects" /></p>
                  <p className="text-2xl font-bold">{statistics.metrics.totalProjects}</p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground"><T k="auto.projectmanagementpage.active_projects" fallback="Active Projects" /></p>
                  <p className="text-2xl font-bold text-primary">{statistics.metrics.activeProjects}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground"><T k="auto.projectmanagementpage.completed" fallback="Completed" /></p>
                  <p className="text-2xl font-bold text-success">{statistics.metrics.completedProjects}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground"><T k="auto.projectmanagementpage.avg_progress" fallback="Avg Progress" /></p>
                  <p className="text-2xl font-bold">{statistics.performanceMetrics.averageProgress}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={statistics.performanceMetrics.averageProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-6">
          <TabsTrigger value="overview"><T k="auto.projectmanagementpage.overview" fallback="Overview" /></TabsTrigger>
          <TabsTrigger value="projects"><T k="auto.projectmanagementpage.projects" fallback="Projects" /></TabsTrigger>
          <TabsTrigger value="dashboard"><T k="auto.projectmanagementpage.dashboard" fallback="Dashboard" /></TabsTrigger>
          <TabsTrigger value="analytics"><T k="auto.projectmanagementpage.analytics" fallback="Analytics" /></TabsTrigger>
          <TabsTrigger value="workflow"><T k="auto.projectmanagementpage.workflow" fallback="Workflow" /></TabsTrigger>
          <TabsTrigger value="reports"><T k="auto.projectmanagementpage.reports" fallback="Reports" /></TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle><T k="auto.projectmanagementpage.project_status_distribution" fallback="Project Status Distribution" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics?.statusTrends?.map((trend) => (
                    <div key={trend.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {PROJECT_STATUS_LABELS[trend.status as ProjectStatus]}
                        </Badge>
                        <span className="text-sm font-medium">{trend.count}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">{trend.percentage.toFixed(1)}%</div>
                        <Progress value={trend.percentage} className="w-24 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Budget Analysis */}
            <Card>
              <CardHeader>
                <CardTitle><T k="auto.projectmanagementpage.budget_analysis" fallback="Budget Analysis" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium"><T k="auto.projectmanagementpage.total_budget" fallback="Total Budget" /></span>
                    <span className="text-sm font-bold">
                      ${statistics?.budgetAnalysis.total?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium"><T k="auto.projectmanagementpage.spent_budget" fallback="Spent Budget" /></span>
                    <span className="text-sm font-bold text-warning">
                      ${statistics?.budgetAnalysis.spent?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium"><T k="auto.projectmanagementpage.remaining" fallback="Remaining" /></span>
                    <span className="text-sm font-bold text-success">
                      ${statistics?.budgetAnalysis.remaining?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium"><T k="auto.projectmanagementpage.utilization" fallback="Utilization" /></span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {statistics?.budgetAnalysis.utilization.toFixed(1)}%
                      </div>
                      <Progress value={statistics?.budgetAnalysis.utilization} className="w-24 h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle><T k="auto.projectmanagementpage.performance_metrics" fallback="Performance Metrics" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {statistics?.performanceMetrics.averageProgress}%
                  </div>
                  <p className="text-sm text-muted-foreground"><T k="auto.projectmanagementpage.average_progress" fallback="Average Progress" /></p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {statistics?.performanceMetrics.onTimeDelivery}%
                  </div>
                  <p className="text-sm text-muted-foreground"><T k="auto.projectmanagementpage.on_time_delivery" fallback="On-Time Delivery" /></p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics?.performanceMetrics.qualityScore}%
                  </div>
                  <p className="text-sm text-muted-foreground"><T k="auto.projectmanagementpage.quality_score" fallback="Quality Score" /></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Projects ({projects?.length})</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedProjects.length === projects?.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <T k="auto.projectmanagementpage.new_project" fallback="New Project" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {projects?.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => handleProjectSelect(project.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.location}
                            {project.regionCode && (
                              <Badge variant="outline" className="text-xs">
                                {project.regionCode}
                              </Badge>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.startDate}
                          </span>
                          <span className="flex items-center gap-1">
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
                        <div className="text-sm text-muted-foreground"><T k="auto.projectmanagementpage.progress" fallback="Progress" /></div>
                        <Progress value={project.progress || 0} className="w-32 h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <ProjectDashboard projectId={projectId} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle><T k="auto.projectmanagementpage.project_analytics" fallback="Project Analytics" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  <T k="auto.projectmanagementpage.select_a_project_to_view_detailed_analytics" fallback="Select a project to view detailed analytics" />
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          {workflow ? (
            <Card>
              <CardHeader>
                <CardTitle><T k="auto.projectmanagementpage.project_workflow" fallback="Project Workflow" /></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold"><T k="auto.projectmanagementpage.current_step" fallback="Current Step" /></h4>
                      <p className="text-sm text-muted-foreground">
                        Step {workflow.currentStep} of {workflow.totalSteps}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline"><TranslatedStatus code={workflow.status} /></Badge>
                    </div>
                  </div>

                  <Progress 
                    value={(workflow.completedSteps / workflow.totalSteps) * 100} 
                    className="w-full" 
                  />

                  <div className="flex gap-2">
                    <Button onClick={advanceWorkflow} disabled={workflow.currentStep >= workflow.totalSteps}>
                      <Target className="h-4 w-4 mr-2" />
                      <T k="auto.projectmanagementpage.advance_workflow" fallback="Advance Workflow" />
                    </Button>
                    <Button variant="outline" onClick={() => blockWorkflow('Manual block' as any)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <T k="auto.projectmanagementpage.block_workflow" fallback="Block Workflow" />
                    </Button>
                  </div>

                  {workflow.blockers?.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong><T k="auto.projectmanagementpage.workflow_blockers" fallback="Workflow Blockers:" /></strong>
                        <ul className="mt-2 list-disc list-inside">
                          {workflow.blockers.map((blocker, index) => (
                            <li key={index}>
                              <strong>{blocker.description}</strong> - <TranslatedSeverity code={blocker.severity} />
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  <T k="auto.projectmanagementpage.select_a_project_to_view_workflow_information" fallback="Select a project to view workflow information" />
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle><T k="auto.projectmanagementpage.project_reports" fallback="Project Reports" /></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.progress_report" fallback="Progress Report" />
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.financial_report" fallback="Financial Report" />
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.resource_report" fallback="Resource Report" />
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Target className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.milestone_report" fallback="Milestone Report" />
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.risk_report" fallback="Risk Report" />
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Shield className="h-6 w-6 mb-2" />
                  <T k="auto.projectmanagementpage.quality_report" fallback="Quality Report" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle><T k="auto.projectmanagementpage.create_new_project" fallback="Create New Project" /></DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title"><T k="auto.projectmanagementpage.project_title" fallback="Project Title" /></Label>
                <Input id="title" placeholder="Enter project title" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="location"><T k="auto.projectmanagementpage.location" fallback="Location" /></Label>
                <UnifiedLocationSelector
                  value={{}}
                  onChange={(loc) => {
                    console.log('Location selected:', loc);
                  }}
                  placeholder="Rechercher une localisation pour le projet..."
                  filter="all"
                />
              </div>
              <div>
                <Label htmlFor="budget"><T k="auto.projectmanagementpage.budget" fallback="Budget" /></Label>
                <Input id="budget" type="number" placeholder="Enter budget" />
              </div>
              <div>
                <Label htmlFor="startDate"><T k="auto.projectmanagementpage.start_date" fallback="Start Date" /></Label>
                <Input id="startDate" type="date" />
              </div>
              <div>
                <Label htmlFor="endDate"><T k="auto.projectmanagementpage.end_date" fallback="End Date" /></Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="description"><T k="auto.projectmanagementpage.description" fallback="Description" /></Label>
              <textarea 
                id="description" 
                placeholder="Enter project description"
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                <T k="auto.projectmanagementpage.cancel" fallback="Cancel" />
              </Button>
              <Button onClick={() => {
                // This would integrate with the createProject hook
                setShowCreateDialog(false);
              }}>
                <T k="auto.projectmanagementpage.create_project" fallback="Create Project" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><T k="auto.projectmanagementpage.bulk_actions" fallback="Bulk Actions" /></DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedProjects.length} projects selected
              </p>
            </div>
            
            <div className="space-y-2">
              <div>
                <Label htmlFor="bulkStatus"><T k="auto.projectmanagementpage.update_status" fallback="Update Status" /></Label>
                <Select onValueChange={(value) => 
                  value ? handleBulkStatusUpdate(value as ProjectStatus) : undefined
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={handleBulkArchive}
                  disabled={selectedProjects.length === 0}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  <T k="auto.projectmanagementpage.archive_selected" fallback="Archive Selected" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkActions(false)}>
                <T k="auto.projectmanagementpage.cancel" fallback="Cancel" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManagementPage;
