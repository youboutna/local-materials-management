import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Edit, Trash2, CreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import { ProjectData } from '@/components/ProjectCard';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/components/ProjectMap';
import { WorkflowInspection } from '@/components/workflow/WorkflowInspection';
import { PaymentHistory } from '@/components/project/PaymentHistory';
import { PaymentDialog } from '@/components/project/PaymentDialog';
import { InspectionReportCard } from '@/components/project/InspectionReportCard';
import { ProjectWithPayments, Inspection, InspectionStatus } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import QuantityTakeoffs from '@/components/project/QuantityTakeoffs';
import ProjectMaterials from '@/components/project/ProjectMaterials';
import ProjectDocuments from '@/components/project/ProjectDocuments';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithPayments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { getProject, deleteProject } = useProjects();

  const fetchProjectWithDetails = async (projectId: string) => {
    try {
      console.log('Fetching project with details for ID:', projectId);
      
      // Fetch project data
      const projectData = await getProject(projectId);
      if (!projectData) {
        throw new Error('Project not found');
      }

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // Fetch inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (inspectionsError) {
        console.error('Error fetching inspections:', inspectionsError);
      }

      // Transform inspections data to match the Inspection interface with proper type casting
      const inspections: Inspection[] = inspectionsData?.map(inspection => ({
        id: inspection.id,
        date: inspection.date,
        status: inspection.status as InspectionStatus,
        inspector: inspection.inspector,
        progress_at_inspection: inspection.progress_at_inspection,
        comments: inspection.comments,
        documents: inspection.documents ? (Array.isArray(inspection.documents) ? inspection.documents : []) : undefined
      })) || [];

      // Combine data
      const projectWithDetails: ProjectWithPayments = {
        ...projectData,
        payments: payments || [],
        inspections: inspections
      };

      console.log('Project with details loaded:', projectWithDetails);
      setProject(projectWithDetails);
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || id === 'create') {
        navigate('/projects/create');
        return;
      }

      console.log('Fetching project with ID:', id);
      setIsLoading(true);
      
      try {
        await fetchProjectWithDetails(id);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du projet.",
          variant: "destructive",
        });
        navigate('/projects');
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
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteProject(id);
      if (success) {
        toast({
          title: "Projet supprimé",
          description: `Le projet "${project.title}" a été supprimé avec succès.`,
        });
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet.",
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
                <p className="text-adrar-600">Chargement des détails du projet...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Projet non trouvé</h1>
              <p className="text-gray-600 mb-8">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
              <Link to="/projects">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la liste des projets
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
  const mapLocation: MapLocation | null = project.coordinates ? {
    id: project.id,
    name: project.title,
    type: "project",
    latitude: project.coordinates.latitude,
    longitude: project.coordinates.longitude,
    status: project.status as any,
    region: project.location,
    startDate: project.startDate
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Project header */}
            <div className="bg-white rounded-xl shadow-elegant p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-serif text-adrar-800 mb-2">{project.title}</h1>
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(project.startDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                
                <div className="flex gap-2 mt-4 lg:mt-0">
                  <Link to={`/projects/${project.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Quick Action Panel */}
            <Card className="border-l-4 border-l-terracotta-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-terracotta-500" />
                  Gestion des paiements
                </CardTitle>
                <CardDescription>
                  Actions rapides pour effectuer un paiement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Budget total: <span className="font-medium">{project.budget.toLocaleString('fr-FR')} MRU</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Progression: <span className="font-medium">{project.progress}%</span>
                    </p>
                  </div>
                  <PaymentDialog 
                    project={project} 
                    onPaymentComplete={handleDataUpdate}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressIndicator value={project.progress} />
                  <p className="text-sm text-gray-600 mt-2">
                    {project.progress}% terminé
                  </p>
                </CardContent>
              </Card>

              {/* Budget Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-terracotta-600">
                    {project.budget.toLocaleString('fr-FR')} MRU
                  </p>
                </CardContent>
              </Card>

              {/* Team Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-adrar-600">
                    {project.teamSize} personnes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs Section - Moved here after project summary */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="materials">Matériaux</TabsTrigger>
                <TabsTrigger value="payments">Paiements</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="takeoffs">Métrés</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Description du projet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <p className="text-gray-700 leading-relaxed">{project.description}</p>
                      
                      {/* Timeline */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Calendrier du projet</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">Date de début</p>
                              <p className="text-sm text-gray-600">
                                {new Date(project.startDate).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <Badge variant="outline">Commencé</Badge>
                          </div>
                          
                          {project.endDate && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">Date de fin prévue</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(project.endDate).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <Badge variant={project.status === 'terminé' ? 'default' : 'secondary'}>
                                {project.status === 'terminé' ? 'Terminé' : 'Prévu'}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Map section */}
                      {mapLocation && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Localisation</h3>
                          <div className="h-96 rounded-lg overflow-hidden">
                            <ProjectMap 
                              locations={[mapLocation]}
                              height="100%"
                              interactive={true}
                              defaultCenter={[mapLocation.latitude, mapLocation.longitude]}
                              defaultZoom={12}
                            />
                          </div>
                          <div className="mt-4 text-sm text-gray-600">
                            <p>
                              Coordonnées: {mapLocation.latitude.toFixed(6)}, {mapLocation.longitude.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials">
                <ProjectMaterials projectId={id!} onUpdate={handleDataUpdate} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentHistory payments={project.payments} />
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
      
      <Footer />
    </div>
  );
};

export default ProjectDetail;
