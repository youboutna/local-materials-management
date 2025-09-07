// components/project/ProjectDetailByDTO.tsx
import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProjectDataTransformer } from '@/services/projectDataTransformer';
import { ProjectData } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  CreditCard,
  FileText,
  BarChart3,
  Target,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import FinancialOverview from '@/components/project/FinaancialOverview';
import PhaseList from '@/components/project/PhaseList';
import RiskOverview from '@/components/project/RiskOverview';
import TaskList from '@/components/project/TaskList';
import TeamOverview from '@/components/project/TeamOverview';
import InteractiveMapGIS from '@/components/materials/InteractiveMapGIS';
import ProjectMaterials from '@/components/project/ProjectMaterials';
import { PaymentHistory } from '@/components/project/PaymentHistory';
import { InspectionReportCard } from '@/components/project/InspectionReportCard';
import { WorkflowInspection } from '@/components/workflow/WorkflowInspection';
import QuantityTakeoffs from '@/components/project/QuantityTakeoffs';
import ProjectDocuments from '@/components/project/ProjectDocuments';
import { PaymentDialog } from '@/components/project/PaymentDialog';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import ReportManager from '@/components/reports/ReportManager';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProjectPhases } from '@/components/project/ProjectPhases';
import { WaterfallGanttChart } from '@/components/project/WaterfallGanttChart';
import { WaterfallProjectKPIs } from '@/components/project/WaterfallProjectKPIs';

const ProjectDetailByDTO: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [mapData, setMapData] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch project data using React Query
  const {
    data: project,
    isLoading,
    error,
    refetch
  } = useQuery<ProjectData | null>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const data = await ProjectDataTransformer.transformProjectData(projectId);
        
        // Initialize map data
        if (data) {
          setMapData({
            coordinates: data.coordinates,
            address: data.location,
            shape: (data as any).localisation || [],
            shapeType: (data as any).forme
          });
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le projet",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!projectId,
  });

  // Fetch payments data
  const { data: payments } = useQuery({
    queryKey: ['project-payments', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch inspections data
  const { data: inspections } = useQuery({
    queryKey: ['project-inspections', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch materials data
  const { data: materials } = useQuery({
    queryKey: ['project-materials', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('quantity_takeoffs')
        .select(`
          *,
          materials (
            id,
            name,
            category,
            unit,
            price_per_unit
          )
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch phases data
  const { data: phases } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch tasks data
  const { data: tasks } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch risks data
  const { data: risks } = useQuery({
    queryKey: ['project-risks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch resources data
  const { data: resources } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Calculate total budget and spent amount for financial overview
  const totalBudget = project?.budget || 0;
  const spentAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

  const handleDelete = async () => {
    if (!project || !projectId) return;

    if (
      !confirm(t("projects.delete_confirm").replace("{title}", project.title))
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        throw error;
      }

      toast({
        title: t("projects.deleted"),
        description: t("projects.deleted_desc").replace(
          "{title}",
          project.title
        ),
      });
      navigate("/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: t("projects.delete_error"),
        description: t("projects.delete_error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDataUpdate = async () => {
    await refetch();
  };

  const handleMapDataChange = (newMapData: any) => {
    setMapData(newMapData);
  };

  const handleSaveLocation = async () => {
    if (!project || !mapData) return;
    
    try {
      const updateData: any = {};
      
      // Update coordinates if provided
      if (mapData.coordinates) {
        updateData.coordinates = {
          latitude: mapData.coordinates.lat,
          longitude: mapData.coordinates.lng
        };
      }
      
      // Update address
      if (mapData.address) {
        updateData.location = mapData.address;
      }
      
      // Update shape data
      if (mapData.shape && mapData.shape.length > 0) {
        updateData.localisation = mapData.shape;
        updateData.forme = mapData.shapeType || 'polygon';
      }

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project.id);

      if (error) {
        console.error("Error updating project location:", error);
        toast({
          title: t("error"),
          description: "Erreur lors de la mise à jour de la localisation",
          variant: "destructive",
        });
      } else {
        toast({
          title: t("success"),
          description: "Localisation mise à jour avec succès",
        });
        setIsEditingLocation(false);
        await handleDataUpdate();
      }
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: t("error"),
        description: "Erreur lors de la mise à jour de la localisation",
        variant: "destructive",
      });
    }
  };

  const handleToggleEditLocation = () => {
    if (isEditingLocation) {
      handleSaveLocation();
    } else {
      setIsEditingLocation(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adrar-600 mx-auto mb-4"></div>
                <p className="text-adrar-600">{t("projects.loading_detail")}</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t("projects.not_found")}
              </h1>
              <p className="text-gray-600 mb-8">
                {t("projects.not_found_desc")}
              </p>
              <Link to="/projects">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("project_create.back_to_projects")}
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project_create.back_to_projects")}
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Project header - Enhanced responsive design */}
            <div className="bg-white rounded-xl shadow-elegant p-6 lg:p-8">
              <div className="flex flex-col space-y-6 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-serif text-adrar-800 mb-3">
                    {project.title}
                  </h1>
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-6 sm:space-y-0 text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm lg:text-base">
                        {project.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm lg:text-base">
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Project header actions */}
                <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                  <ReportManager 
                    data={{ project }}
                    reportType="project"
                  />
                  <Link to={`/projects/${project.id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Edit className="mr-2 h-4 w-4" />
                      {t("projects.edit.title")}
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? t("projects.deleting") : t("projects.delete")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Tabs Section - Enhanced responsive design */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="overflow-x-auto">
                <TabsList className="grid w-full min-w-fit grid-cols-12 h-auto p-1">
                  <TabsTrigger
                    value="overview"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.overview")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="phases"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Phases
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Tâches
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Équipe
                  </TabsTrigger>
                  <TabsTrigger
                    value="finances"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Finances
                  </TabsTrigger>
                  <TabsTrigger
                    value="risks"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Risques
                  </TabsTrigger>
                  <TabsTrigger
                    value="shapes"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    Formes
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.materials")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payments"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.payments")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="inspections"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.inspections")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="workflow"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.workflow")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.documents")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="takeoffs"
                    className="text-xs sm:text-sm whitespace-nowrap px-2 py-2"
                  >
                    {t("projects.tab.takeoffs")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("projects.overview.description")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <p className="text-gray-700 leading-relaxed">
                        {project.description}
                      </p>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              Risques identifiés ({risks?.length || 0})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {risks?.slice(0, 3).map((risk, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm">{risk.title}</span>
                                  <Badge variant={risk.probability > 50 ? "destructive" : "outline"}>
                                    {risk.probability}%
                                  </Badge>
                                </div>
                              ))}
                              {risks && risks.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{risks.length - 3} autres risques
                                </p>
                              )}
                              {(!risks || risks.length === 0) && (
                                <p className="text-xs text-muted-foreground">
                                  Aucun risque identifié
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Ressources ({resources?.length || 0})
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {resources?.slice(0, 3).map((resource, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm">{resource.name}</span>
                                  <Badge variant="outline">{resource.type}</Badge>
                                </div>
                              ))}
                              {resources && resources.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{resources.length - 3} autres ressources
                                </p>
                              )}
                              {(!resources || resources.length === 0) && (
                                <p className="text-xs text-muted-foreground">
                                  Aucune ressource assignée
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Action Panel - Enhanced design */}
                      <Card className="border-l-4 border-l-terracotta-500 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-3 text-lg lg:text-xl">
                            <div className="p-2 bg-terracotta-100 rounded-lg">
                              <CreditCard className="h-5 w-5 text-terracotta-600" />
                            </div>
                            {t("projects.payments_management")}
                          </CardTitle>
                          <CardDescription className="text-sm lg:text-base">
                            {t("projects.quick_payment_actions")}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {t("project_create.form.budget")}
                                  </p>
                                  <p className="font-semibold text-lg">
                                    {project.budget.toLocaleString()} MRU
                                  </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {t("project_create.form.progress")}
                                  </p>
                                  <p className="font-semibold text-lg">
                                    {project.progress}%
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="w-full sm:w-auto">
                              <PaymentDialog
                                project={project}
                                onPaymentComplete={handleDataUpdate}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Project details grid - Enhanced responsive design */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Progress Card */}
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base lg:text-lg">
                              {t("project_create.form.progress")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ProgressIndicator value={project.progress} />
                            <p className="text-sm text-gray-600 mt-2">
                              {project.progress}% {t("projects.progress_done")}
                            </p>
                          </CardContent>
                        </Card>

                        {/* Budget Card */}
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              {t("project_create.form.budget")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xl lg:text-2xl font-bold text-terracotta-600">
                              {project.budget.toLocaleString()} MRU
                            </p>
                          </CardContent>
                        </Card>

                        {/* Team Card */}
                        <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              {t("project_create.form.team_size")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xl lg:text-2xl font-bold text-adrar-600">
                              {project.teamSize || 0} {t("dashboard.members")}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {t("projects.timeline")}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">
                                {t("projects.start_date")}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(project.startDate).toLocaleDateString(
                                  undefined,
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {t("projects.started")}
                            </Badge>
                          </div>

                          {project.endDate && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">
                                  {t("projects.end_date_expected")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(project.endDate).toLocaleDateString(
                                    undefined,
                                    {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  project.status === "completed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {project.status === "completed"
                                  ? t("projects.completed")
                                  : t("projects.expected")}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Map section with InteractiveMapGIS */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">
                            {t("projects.location")}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToggleEditLocation}
                          >
                            {isEditingLocation ? "Sauvegarder" : "Modifier position"}
                          </Button>
                        </div>
                        <InteractiveMapGIS
                          title="Localisation du projet"
                          description={isEditingLocation ? "Modifiez la position du projet" : "Position actuelle du projet"}
                          value={mapData}
                          onChange={handleMapDataChange}
                          allowPolygon={true}
                          className="mb-4"
                        />
                        
                        {/* Project Location Information */}
                        <div className="mt-4 space-y-3">
                          <div className="p-4 bg-gradient-to-br from-card via-card/90 to-muted/20 rounded-lg border border-border/50">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              Position actuelle du projet
                            </h4>
                            
                            <div className="space-y-2 text-sm">
                              {/* GPS Coordinates */}
                              {mapData?.coordinates ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-muted-foreground">Coordonnées GPS:</span>
                                  <span className="text-foreground font-mono">
                                    {mapData.coordinates.lat.toFixed(6)}, {mapData.coordinates.lng.toFixed(6)}
                                  </span>
                                </div>
                              ) : project.coordinates?.latitude && project.coordinates?.longitude ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-muted-foreground">Coordonnées GPS:</span>
                                  <span className="text-foreground font-mono">
                                    {project.coordinates.latitude.toFixed(6)}, {project.coordinates.longitude.toFixed(6)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="font-medium">Coordonnées GPS:</span>
                                  <span className="italic">Non définies</span>
                                </div>
                              )}
                              
                              {/* Address */}
                              <div className="space-y-1">
                                <h5 className="font-medium text-muted-foreground">Adresse de localisation</h5>
                                {mapData?.address ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-foreground">{mapData.address}</span>
                                  </div>
                                ) : (project as any).adresse ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-foreground">
                                      {typeof (project as any).adresse === 'string' ? (project as any).adresse : (project as any).adresse?.address || project.location}
                                    </span>
                                  </div>
                                ) : project.location ? (
                                  <div className="flex items-start gap-2">
                                    <span className="text-foreground">{project.location}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 text-muted-foreground">
                                    <span className="italic">Aucune adresse définie</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Shapes Information */}
                              <div className="space-y-2">
                                <h5 className="font-medium text-muted-foreground">Données géométriques</h5>
                                {mapData?.shape && mapData.shape.length > 0 ? (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium text-muted-foreground">Forme tracée:</span>
                                    <span className="text-foreground">
                                      {mapData.shapeType || 'polygon'} ({mapData.shape.length} points)
                                    </span>
                                  </div>
                                ) : (project as any).localisation && Array.isArray((project as any).localisation) && (project as any).localisation.length > 0 ? (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium text-muted-foreground">Forme tracée:</span>
                                    <span className="text-foreground">
                                      {(project as any).forme || 'polygon'} ({(project as any).localisation.length} points)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 text-muted-foreground">
                                    <span className="font-medium">Forme géométrique:</span>
                                    <span className="italic">Aucune forme géométrique tracée</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Project Reference */}
                              {project.projectReference && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-muted-foreground">Référence:</span>
                                  <span className="text-foreground font-mono">{project.projectReference}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="phases">
                <div className="space-y-6">
                  {/* Waterfall KPIs */}
                  <WaterfallProjectKPIs />
                  
                  {/* Gantt Chart */}
                  <WaterfallGanttChart 
                    tasks={phases?.map(phase => ({
                      id: phase.id,
                      name: phase.title,
                      startDate: new Date(phase.start_date),
                      endDate: new Date(phase.end_date),
                      progress: phase.progress || 0,
                      phase: 'Waterfall',
                      status: phase.status as any,
                      procurementStep: Math.floor(Math.random() * 5) + 1,
                      assignedTo: 'Équipe projet',
                      budget: phase.budget || 0
                    })) || []}
                    projectStartDate={new Date(project.startDate)}
                    projectEndDate={project.endDate ? new Date(project.endDate) : new Date()}
                    ProjectTitle={project.title || "Projet"}
                    ProjectDescription={project.description || "Description du projet"}
                    ProjectLocation={project.location || "Localisation"}
                    ProjectStatus={project.status || "En cours"}
                    ProjectProgress={project.progress || 0}
                    projectBudget={project.budget || 0}
                    ProjectTeamSize={project.teamSize || 1}
                  />
                  
                  {/* Traditional Project Phases */}
                  <ProjectPhases 
                    projectId={projectId!} 
                    onUpdate={handleDataUpdate} 
                    projectBudget={project.budget || 0}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <TaskList 
                  tasks={tasks || []} 
                  projectId={projectId!} 
                />
              </TabsContent>

              <TabsContent value="team">
                <TeamOverview 
                  resources={resources || []} 
                  projectId={projectId!} 
                />
              </TabsContent>

              <TabsContent value="finances">
                <FinancialOverview 
                  budget={totalBudget}
                  spent={spentAmount}    
                  phases={phases || []}
                  financialMetrics={project.financialMetrics}
                />
              </TabsContent>

              <TabsContent value="risks">
                <RiskOverview 
                  risks={risks || []} 
                  projectId={projectId!} 
                />
              </TabsContent>

              <TabsContent value="shapes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Formes et Délimitations du Projet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Définissez et visualisez les formes géométriques et délimitations associées au projet.
                    </p>
                    <InteractiveMapGIS
                      title="Formes du projet"
                      description="Dessinez des formes pour délimiter les zones du projet"
                      value={mapData}
                      onChange={setMapData}
                      allowPolygon={true}
                      className="mb-4"
                    />
                    {mapData?.shape && mapData?.shape?.length > 0 && (
                      <div className="mt-4 bg-muted/50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Informations sur la forme:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Type:</span> {mapData?.shapeType || "polygon"}
                          </div>
                          <div>
                            <span className="font-medium">Points:</span> {mapData?.shape?.length || 0}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials">
                <ProjectMaterials projectId={projectId!} onUpdate={handleDataUpdate} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentHistory payments={payments || []} />
              </TabsContent>

              <TabsContent value="inspections">
                <InspectionReportCard project={{
                  ...project,
                  inspections: inspections || []
                }} />
              </TabsContent>

              <TabsContent value="workflow">
                <WorkflowInspection
                  project={{
                    ...project,
                    inspections: inspections || []
                  }}
                  onInspectionUpdate={handleDataUpdate}
                />
              </TabsContent>

              <TabsContent value="documents">
                <ProjectDocuments projectId={projectId!} />
              </TabsContent>

              <TabsContent value="takeoffs">
                <QuantityTakeoffs projectId={projectId!} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetailByDTO;