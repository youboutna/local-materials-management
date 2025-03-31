
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import { Button } from '@/components/ui/button';
import ProjectMap from '@/components/ProjectMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getProject } = useProjects();

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      setLoading(true);
      const projectData = await getProject(id);
      
      if (projectData) {
        setProject(projectData);
      } else {
        console.error(`404 Error: User attempted to access non-existent route: /projects/${id}`);
      }
      
      setLoading(false);
    };

    fetchProject();
  }, [id, getProject]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">Chargement du projet...</p>
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
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-serif text-adrar-800 mb-4">Projet introuvable</h1>
              <p className="text-adrar-600 mb-8">Désolé, le projet que vous recherchez n'existe pas ou a été supprimé.</p>
              <Button 
                onClick={() => navigate('/projects')}
                className="bg-terracotta-500 hover:bg-terracotta-600"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retourner à la liste des projets
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format budget to locale string
  const formattedBudget = new Intl.NumberFormat('fr-MR', {
    style: 'currency',
    currency: 'MRU',
    maximumFractionDigits: 0,
  }).format(project.budget);

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
            {/* Project Header */}
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="rounded-lg overflow-hidden h-64">
                    <img 
                      src={project.thumbnail} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-serif text-adrar-800">{project.title}</h1>
                    <StatusBadge status={project.status} />
                  </div>
                  
                  <p className="text-adrar-600 mb-6">{project.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-terracotta-500" />
                      <span className="text-adrar-700">{project.location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-terracotta-500" />
                      <span className="text-adrar-700">
                        {new Date(project.startDate).toLocaleDateString('fr-FR')}
                        {project.endDate ? ` - ${new Date(project.endDate).toLocaleDateString('fr-FR')}` : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-terracotta-500" />
                      <span className="text-adrar-700">{project.teamSize} personnes</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Banknote className="h-5 w-5 mr-2 text-terracotta-500" />
                      <span className="text-adrar-700">{formattedBudget}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="font-medium text-adrar-700">Progression du projet</p>
                      <p className="font-medium text-adrar-700">{project.progress}%</p>
                    </div>
                    <ProgressIndicator progress={project.progress} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Project Map */}
            {project.coordinates && (
              <ProjectMap 
                locations={[
                  {
                    id: project.id,
                    name: project.title,
                    type: 'project',
                    latitude: project.coordinates.latitude,
                    longitude: project.coordinates.longitude
                  }
                ]}
                className="mb-8"
              />
            )}
            
            {/* Additional project details could be added here */}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectDetail;
