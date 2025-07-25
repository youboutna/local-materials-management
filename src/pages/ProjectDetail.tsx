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
import ProjectMap from "@/components/ProjectMap";
import { MapLocation } from "@/components/ProjectMap";
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

const ProjectDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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

      // Calculate real progress from phases
      let realProgress = 0;
      if (phasesData && phasesData.length > 0) {
        const totalProgress = phasesData.reduce((sum, phase) => sum + (phase.progress || 0), 0);
        realProgress = Math.round(totalProgress / phasesData.length);
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

      // Fetch inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from("inspections")
        .select("*")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (inspectionsError) {
        console.error("Error fetching inspections:", inspectionsError);
      }

      // Transform inspections data to match the Inspection interface with proper type casting
      const inspections: Inspection[] =
        inspectionsData?.map((inspection) => ({
          id: inspection.id,
          date: inspection.date,
          status: inspection.status as InspectionStatus,
          inspector: inspection.inspector,
          progress_at_inspection: inspection.progress_at_inspection,
          comments: inspection.comments,
          documents: inspection.documents
            ? Array.isArray(inspection.documents)
              ? inspection.documents
              : []
            : undefined,
        })) || [];

      // Combine data with real calculated values
      const projectWithDetails: ProjectWithPayments = {
        ...projectData,
        progress: realProgress, // Use calculated progress from phases
        teamSize: realTeamSize, // Use calculated team size
        payments: payments,
        inspections: inspections,
        phases: phasesData || [],
        milestones: milestonesData || [],
        materials: materialsData || [],
        team: teamData || [],
      };

      console.log("Project with details loaded:", projectWithDetails);
      setProject(projectWithDetails);
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

  // Create map location if coordinates exist
  const mapLocation: MapLocation | null = project.coordinates
    ? {
        id: project.id,
        name: project.title,
        type: "project",
        latitude: project.coordinates.latitude,
        longitude: project.coordinates.longitude,
        status: project.status as any,
        region: project.location,
        startDate: project.startDate,
      }
    : null;

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

              <p className="text-gray-700 leading-relaxed mt-4">
                {project.description}
              </p>
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
                    {project.teamSize} {t("dashboard.members")}
                  </p>
                </CardContent>
              </Card>
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

                      {/* Map section */}
                      {mapLocation && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">
                            {t("projects.location")}
                          </h3>
                          <div className="h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden">
                            <ProjectMap
                              locations={[mapLocation]}
                              height="100%"
                              interactive={true}
                              defaultCenter={[
                                mapLocation.latitude,
                                mapLocation.longitude,
                              ]}
                              defaultZoom={12}
                            />
                          </div>
                          <div className="mt-4 text-sm text-gray-600">
                            <p>
                              {t("map.latitude")}:{" "}
                              {mapLocation.latitude.toFixed(6)},{" "}
                              {t("map.longitude")}:{" "}
                              {mapLocation.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="phases">
                <ProjectPhases 
                  projectId={id!} 
                  onUpdate={handleDataUpdate} 
                  projectBudget={project?.budget || 0}
                />
              </TabsContent>

              <TabsContent value="shapes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Formes du Projet
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Visualisation des formes et délimitations associées au projet.
                    </p>
                    {mapLocation && (
                      <div className="h-96 rounded-lg overflow-hidden border">
                        <ProjectMap
                          locations={[mapLocation]}
                          height="100%"
                          interactive={true}
                          defaultCenter={[mapLocation.latitude, mapLocation.longitude]}
                          defaultZoom={15}
                        />
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
