
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import { ProjectData } from '@/components/ProjectCard';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/components/ProjectMap';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { getProject, deleteProject } = useProjects();

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || id === 'create') {
        // Don't try to fetch if we're on the create route
        navigate('/projects/create');
        return;
      }

      console.log('Fetching project with ID:', id);
      setIsLoading(true);
      
      try {
        const projectData = await getProject(id);
        console.log('Project data received:', projectData);
        
        if (projectData) {
          setProject(projectData);
        } else {
          console.log('No project found for ID:', id);
          toast({
            title: "Projet non trouvé",
            description: "Le projet que vous recherchez n'existe pas ou a été supprimé.",
            variant: "destructive",
          });
          navigate('/projects');
        }
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

    // Only fetch if we have an ID and haven't loaded this project yet
    if (id && (!project || project.id !== id)) {
      fetchProject();
    }
  }, [id]); // Remove getProject and navigate from dependencies to prevent infinite loops

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
          >
            {/* Project header */}
            <div className="bg-white rounded-xl shadow-elegant p-8 mb-8">
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

            {/* Project details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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

            {/* Map section */}
            {mapLocation && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Localisation</CardTitle>
                  <CardDescription>Position géographique du projet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <ProjectMap 
                      locations={[mapLocation]}
                      height="100%"
                      width="100%"
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
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Calendrier du projet</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectDetail;
