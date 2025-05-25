import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectMap from '@/components/ProjectMap';
import { ProjectData } from '@/components/ProjectCard';
import { WorkflowInspection } from '@/components/workflow/WorkflowInspection';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, deleteProject } = useProjects();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        toast({
          title: "Erreur",
          description: "ID du projet non trouvé",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        const projectData = await getProject(id);
        
        if (!projectData) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails du projet.",
            variant: "destructive",
          });
          setProject(null);
        } else {
          setProject(projectData);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des données du projet.",
          variant: "destructive",
        });
        setProject(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, getProject, toast]);
  
  const handleDelete = async () => {
    if (!project || !window.confirm("Êtes-vous sûr de vouloir supprimer ce projet?")) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteProject(project.id);
      if (success) {
        window.location.href = "/projects";
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le projet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du projet.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <Button variant="ghost" disabled>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="border-4 border-adrar-600/30 border-t-adrar-600 rounded-full w-12 h-12 animate-spin" />
                  <p className="text-gray-600">Chargement du projet...</p>
                </div>
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
            <div className="h-screen flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
              <p className="mb-6 text-gray-600">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
              <Link to="/projects">
                <Button>Retour à la liste des projets</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
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
          
          {/* Project header */}
          <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-adrar-900">{project.title}</h1>
                <p className="text-lg text-muted-foreground mt-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {project.location}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/projects/edit/${project.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Description du projet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Date de début</div>
                              <div className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Équipe</div>
                              <div className="font-medium">{project.teamSize} personnes</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <Percent className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Progression</div>
                              <div className="font-medium">{project.progress}%</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Budget</div>
                              <div className="font-medium">{project.budget.toLocaleString()} MRU</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    {project.coordinates && (
                      <Card className="mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Localisation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] rounded-md overflow-hidden">
                            <ProjectMap 
                              locations={[{
                                id: project.id,
                                name: project.title,
                                latitude: project.coordinates.latitude,
                                longitude: project.coordinates.longitude,
                                type: 'project',
                                status: project.status,
                                region: project.location,
                                startDate: project.startDate
                              }]} 
                              interactive={true} 
                            />
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Coordonnées: {project.coordinates.latitude.toFixed(6)}, {project.coordinates.longitude.toFixed(6)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Workflow Tab */}
              <TabsContent value="workflow" className="mt-6">
                <WorkflowInspection 
                  project={project as any} 
                  onInspectionUpdate={() => {
                    // Refresh project data when inspection is updated
                    const fetchProject = async () => {
                      if (id) {
                        try {
                          const projectData = await getProject(id);
                          if (projectData) {
                            setProject(projectData);
                          }
                        } catch (error) {
                          console.error("Error refreshing project:", error);
                        }
                      }
                    };
                    fetchProject();
                  }}
                />
              </TabsContent>
              
              {/* Details Tab */}
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Détails du projet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{project.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectDetail;
