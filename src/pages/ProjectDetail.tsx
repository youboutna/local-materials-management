
// This is a stub file to fix TypeScript errors. We don't need to modify this file's functionality,
// but need to make it compile without errors.

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '@/hooks/projects/useProjects';
import { ProjectData } from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  DollarSign,
  ArrowLeft,
  Clock,
  Eye,
  MapPin,
  Trash,
  UserCheck
} from 'lucide-react';
import ProjectMap from '@/components/ProjectMap';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, deleteProject } = useProjects();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        try {
          const projectData = await getProject(id);
          if (projectData) {
            setProject(projectData);
          } else {
            toast({
              title: "Erreur",
              description: "Projet non trouvé",
              variant: "destructive",
            });
            navigate('/projects');
          }
        } catch (error) {
          console.error("Error fetching project:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails du projet",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProject();
  }, [id, getProject, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const success = await deleteProject(id);
      if (success) {
        toast({
          title: "Suppression réussie",
          description: "Le projet a été supprimé avec succès",
        });
        navigate('/projects');
      } else {
        throw new Error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96">
          <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Projet non trouvé</h2>
          <Button asChild>
            <Link to="/projects">Retour aux projets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" asChild>
          <Link to="/projects" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Link>
        </Button>
        
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link to={`/projects/${project.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera définitivement le projet "{project.title}". Cette action ne peut pas être annulée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Project header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="relative h-64">
          <img 
            src={project.thumbnail} 
            alt={project.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <StatusBadge status={project.status} className="mb-2" />
            <h1 className="text-3xl font-bold text-white">{project.title}</h1>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-6">{project.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-adrar-100 flex items-center justify-center mr-3">
                <MapPin className="h-5 w-5 text-adrar-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Localisation</p>
                <p className="font-medium">{project.location}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-adrar-100 flex items-center justify-center mr-3">
                <Calendar className="h-5 w-5 text-adrar-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Période</p>
                <p className="font-medium">
                  {project.startDate} {project.endDate ? `- ${project.endDate}` : ""}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-adrar-100 flex items-center justify-center mr-3">
                <Users className="h-5 w-5 text-adrar-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taille de l'équipe</p>
                <p className="font-medium">{project.teamSize} personnes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress and budget sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Progression du projet</h2>
          <div className="mb-4">
            <ProgressIndicator value={project.progress} />
            <p className="text-center mt-2 text-gray-600">{project.progress}% complété</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Budget</h2>
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-adrar-600 mr-2" />
              <span className="text-3xl font-bold text-gray-800">
                {project.budget?.toLocaleString('fr-FR')} MRU
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map section */}
      {project.coordinates && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Localisation du projet</h2>
          <ProjectMap 
            locations={[
              {
                id: project.id,
                name: project.title,
                type: 'project',
                latitude: project.coordinates.latitude,
                longitude: project.coordinates.longitude,
                status: project.status
              }
            ]} 
          />
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
