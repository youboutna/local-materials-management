import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Trash2,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProjects } from "@/hooks/projects/useProjects";
import { ProjectData } from "@/components/ProjectCard";
import StatusBadge from "@/components/StatusBadge";
import ProgressIndicator from "@/components/ProgressIndicator";
import InteractiveMapGIS from "@/components/materials/InteractiveMapGIS";
import { WorkflowInspection } from "@/components/workflow/WorkflowInspection";
import { PaymentHistory } from "@/components/project/PaymentHistory";
import { PaymentDialog } from "@/components/project/PaymentDialog";
import { InspectionReportCard } from "@/components/project/InspectionReportCard";
import {
  ProjectWithPayments,
  Inspection,
  InspectionStatus,
  Payment,
} from "@/types/project";
import { supabase } from "@/integrations/supabase/client";
import QuantityTakeoffs from "@/components/project/QuantityTakeoffs";
import ProjectMaterials from "@/components/project/ProjectMaterials";
import ProjectDocuments from "@/components/project/ProjectDocuments";
import ProjectPhases from "@/components/project/ProjectPhases";
import { ReportManager } from "@/components/reports/ReportManager";
import { useLanguage } from "@/contexts/LanguageContext";
import WaterfallGanttChart from "@/components/project/WaterfallGanttChart";
import WaterfallProjectKPIs from "@/components/project/WaterfallProjectKPIs";

const ProjectDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mapData, setMapData] = useState<any>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const { getProject, deleteProject } = useProjects();

  const fetchProjectWithDetails = async (projectId: string) => {
    try {
      console.log("Fetching project with details for ID:", projectId);

      // Fetch project data
      const projectData = await getProject(projectId);
      if (!projectData) {
        throw new Error("Project not found");
      }

      // Fetch project phases to calculate real progress
      const { data: phasesData, error: phasesError } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId);

      if (phasesError) {
        console.error("Error fetching phases:", phasesError);
      }

      // Fetch inspections first to calculate progress based on inspection results
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from("inspections")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (inspectionsError) {
        console.error("Error fetching inspections:", inspectionsError);
      }

      // Calculate real progress from phases and inspections
      let realProgress = 0;
      if (phasesData && phasesData.length > 0) {
        const totalProgress = phasesData.reduce((sum, phase) => sum + (phase.progress || 0), 0);
        realProgress = Math.round(totalProgress / phasesData.length);
      }

      // Adjust progress based on latest approved inspections
      if (inspectionsData && inspectionsData.length > 0) {
        const approvedInspections = inspectionsData.filter(
          (inspection) => inspection.status === "approved"
        );
        if (approvedInspections.length > 0) {
          const latestApprovedInspection = approvedInspections[0];
          // Use the higher value between calculated phase progress and inspection progress
          realProgress = Math.max(realProgress, latestApprovedInspection.progress_at_inspection || 0);
        }
      }

      // Fetch project milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId);

      if (milestonesError) {
        console.error("Error fetching milestones:", milestonesError);
      }

      // Fetch materials for the project
      const { data: materialsData, error: materialsError } = await supabase
        .from("quantity_takeoffs")
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
        .eq("project_id", projectId);

      if (materialsError) {
        console.error("Error fetching materials:", materialsError);
      }

      // Fetch team members (phase employees)
      const { data: teamData, error: teamError } = await supabase
        .from("phase_employees")
        .select(`
          *,
          project_phases!inner(project_id)
        `)
        .eq("project_phases.project_id", projectId);

      if (teamError) {
        console.error("Error fetching team:", teamError);
      }

      // Calculate real team size
      const realTeamSize = teamData ? teamData.length : projectData.teamSize;

      // Fetch payments with all new fields
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          id,
          amount,
          payment_date,
          payment_method,
          progress_at_payment,
          transaction_id,
          contractor_id,
          contractor_name,
          contractor_contact,
          bank_name,
          account_number,
          check_number,
          mobile_number,
          mobile_operator,
          receiver_name
        `
        )
        .eq("project_id", projectId)
        .order("payment_date", { ascending: false });

      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
      }

      // Transform payments to match Payment interface with proper null handling
      const payments: Payment[] =
        paymentsData?.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          progress_at_payment: payment.progress_at_payment,
          transaction_id: payment.transaction_id,
          contractor_id: payment.contractor_id || undefined,
          contractor_name: payment.contractor_name || "",
          contractor_contact: payment.contractor_contact || "",
          bank_name: payment.bank_name || undefined,
          account_number: payment.account_number || undefined,
          check_number: payment.check_number || undefined,
          mobile_number: payment.mobile_number || undefined,
          mobile_operator: payment.mobile_operator || undefined,
          receiver_name: payment.receiver_name || undefined,
        })) || [];

      // Inspections already fetched above for progress calculation

      // Transform inspections data to match the Inspection interface with proper type casting
      const inspections: Inspection[] =
        inspectionsData?.map((inspection) => ({
          id: inspection.id,
          project_id: inspection.project_id || projectId,
          date: inspection.date,
          status: inspection.status as any,
          inspector: inspection.inspector,
          progress_at_inspection: inspection.progress_at_inspection,
          comments: inspection.comments,
          created_at: inspection.created_at || new Date().toISOString(),
          updated_at: inspection.updated_at || new Date().toISOString(),
          documents: Array.isArray(inspection.documents) 
            ? inspection.documents.filter(d => d !== null).map(d => String(d))
            : [],
        })) || [];

      // Fetch documents for the project
      const { data: documentsData, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId);

      if (documentsError) {
        console.error("Error fetching documents:", documentsError);
      }

      // Create mock tasks based on example project structure
      const tasks = [
        {
          id: `task-${projectId}-1`,
          name: "Préparation du site",
          description: "Préparation et nettoyage du site de construction",
          phaseId: "phase-001",
          dependencies: [],
          assignedTo: [],
          estimatedDuration: 30,
          actualDuration: 0,
          startDate: projectData.startDate || "",
          endDate: "",
          status: "not_started" as const,
          progress: 0,
          weight: 0.2,
          costEstimate: 100000,
          actualCost: 0
        }
      ];

      // Fetch resources (employees and equipment)
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("employees")
        .select("*")
        .limit(10);

      if (resourcesError) {
        console.error("Error fetching resources:", resourcesError);
      }

      // Transform resources to match interface
      const resources = resourcesData?.map(resource => ({
        id: resource.id,
        name: resource.full_name || "",
        type: 'human' as const,
        skills: resource.skills || [],
        costPerHour: resource.salary ? Number(resource.salary) / 160 : 0, // Assuming 160 hours/month
        availability: 100,
        assignedTasks: []
      })) || [];

      // Combine data with real calculated values
      const projectWithDetails: ProjectWithPayments = {
        ...projectData,
        progress: realProgress, // Use calculated progress from phases
        teamSize: realTeamSize, // Use calculated team size
        // ProjectWithPayments specific fields
        payments: payments,
        inspections: inspections,
        phases: phasesData || [],
        milestones: milestonesData || [],
        materials: materialsData || [],
        team: teamData || [],
        // Ensure ProjectData fields are properly initialized
        tasks: tasks,
        resources: resources,
        risks: [],
        contacts: [],
        insurancePolicies: [],
        alerts: [],
        constructionMilestones: [],
        escalationThresholds: {
          alert: 10,
          notification: 20,
          guarantee: 30,
          legal: 40
        },
        checkScheduleLastRun: {}
      };

      console.log("Project with details loaded:", projectWithDetails);
      setProject(projectWithDetails);

      // Initialize map data if project has coordinates or localization data
      let initialMapData: any = {
        coordinates: undefined,
        address: projectWithDetails.location || "",
        shape: [],
        shapeType: undefined
      };

      if (projectWithDetails.coordinates?.latitude && projectWithDetails.coordinates?.longitude) {
        initialMapData.coordinates = {
          lat: projectWithDetails.coordinates.latitude,
          lng: projectWithDetails.coordinates.longitude,
        };
      }

      // Add localization data if available
      const projectExtended = projectWithDetails as any;
      if (Array.isArray(projectExtended.localisation) && projectExtended.localisation.length > 0) {
        initialMapData.shape = projectExtended.localisation;
        initialMapData.polygon = projectExtended.localisation;
        initialMapData.warehouseShape = projectExtended.localisation;
      }
      
      if (projectExtended.forme) {
        initialMapData.shapeType = projectExtended.forme;
      }
      
      if (projectExtended.adresse) {
        initialMapData.address = typeof projectExtended.adresse === 'string' 
          ? projectExtended.adresse 
          : projectExtended.adresse.address || projectWithDetails.location || "";
      }

      setMapData(initialMapData);
    } catch (error) {
      console.error("Error fetching project details:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || id === "create") {
        navigate("/projects/create");
        return;
      }

      console.log("Fetching project with ID:", id);
      setIsLoading(true);

      try {
        await fetchProjectWithDetails(id);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: t("error"),
          description: t("projects.loading_error"),
          variant: "destructive",
        });
        navigate("/projects");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && (!project || project.id !== id)) {
      fetchProject();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!project || !id) return;

    if (
      !confirm(t("projects.delete_confirm").replace("{title}", project.title))
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteProject(id);
      if (success) {
        toast({
          title: t("projects.deleted"),
          description: t("projects.deleted_desc").replace(
            "{title}",
            project.title
          ),
        });
        navigate("/projects");
      }
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
    if (id) {
      await fetchProjectWithDetails(id);
    }
  };

  const handleMapDataChange = (newMapData: any) => {
    console.log('Map data changed:', newMapData);
    setMapData(newMapData);
  };

  const handleSaveLocation = async () => {
    if (!project || !mapData) return;
    
    try {
      const updateData: any = {};
      
      // Update coordinates if provided
      if (mapData.coordinates) {
        updateData.coordinates_latitude = mapData.coordinates.lat;
        updateData.coordinates_longitude = mapData.coordinates.lng;
      }
      
      // Update address
      if (mapData.address) {
        updateData.location = mapData.address;
        updateData.adresse = mapData.address;
      }
      
      // Update shape data - properly handle the shape format
      if (mapData.shape && mapData.shape.length > 0) {
        updateData.localisation = mapData.shape;
        updateData.forme = mapData.shapeType || 'polygon';
      }

      console.log('Updating project with data:', updateData);

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
      // Save when toggling from edit mode to view mode
      handleSaveLocation();
    } else {
      // Enter edit mode
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

  if (!project) {
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
                <TabsList className="grid w-full min-w-fit grid-cols-9 h-auto p-1">
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
                      {project.teamSize} {t("dashboard.members")}
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
                                  project.status === "terminé"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {project.status === "terminé"
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
                    tasks={project?.phases?.map(phase => ({
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
                    projectStartDate={new Date(project?.startDate)}
                    projectEndDate={project?.endDate ? new Date(project.endDate) : new Date()}
                    ProjectTitle={project?.title || "Projet"}
                    ProjectDescription={project?.description || "Description du projet"}
                    ProjectLocation={project?.location || "Localisation"}
                    ProjectStatus={project?.status || "En cours"}
                    ProjectProgress={project?.progress || 0}
                    projectBudget={project?.budget || 0}
                    ProjectTeamSize={project?.teamSize || 1}
                  />
                  
                  {/* Traditional Project Phases */}
                  <ProjectPhases 
                    projectId={id!} 
                    onUpdate={handleDataUpdate} 
                    projectBudget={project?.budget || 0}
                  />
                </div>
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
                <ProjectMaterials projectId={id!} onUpdate={handleDataUpdate} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentHistory payments={project.payments || []} />
              </TabsContent>

              <TabsContent value="inspections">
                <InspectionReportCard project={project} />
              </TabsContent>

              <TabsContent value="workflow">
                <WorkflowInspection
                  project={project}
                  onInspectionUpdate={handleDataUpdate}
                />
              </TabsContent>

              <TabsContent value="documents">
                <ProjectDocuments projectId={id!} />
              </TabsContent>

              <TabsContent value="takeoffs">
                <QuantityTakeoffs projectId={id!} />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

    </div>
  );
};

export default ProjectDetail;
