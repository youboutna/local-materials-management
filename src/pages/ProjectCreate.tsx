
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectFormWithMap from '@/components/project/ProjectFormWithMap';
import { supabase } from '@/integrations/supabase/client';

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createProject } = useProjects();

  // Handle form submission from ProjectFormWithMap
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Prepare coordinates for the API
      const projectCoordinates = data.facilitiesLocation?.center ? {
        latitude: data.facilitiesLocation.center.lat,
        longitude: data.facilitiesLocation.center.lng
      } : undefined;
      
      // Create the new project with all the form data
      const projectResult = await createProject({
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: 0, // Default progress for new projects
        budget: data.budget,
        startDate: data.start_date,
        endDate: data.end_date,
        thumbnail: '/img/project-placeholder.jpg',
        teamSize: data.team_size,
        coordinates: projectCoordinates,
        financingSource: data.financing_source,
        marketType: data.market_type,
        selectionMode: data.selection_mode,
        projectResponsableId: data.project_responsable_id,
        mainContractor: data.main_contractor
      });
      
      toast({
        title: t("project_create.toast.created"),
        description: t("project_create.toast.created_desc") + data.title,
      });
      
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: t("project_create.toast.error"),
        description: t("project_create.toast.error_desc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
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
            className="max-w-6xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">{t("project_create.title")}</h1>
              
              <ProjectFormWithMap 
                onSubmit={handleFormSubmit}
              />
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectCreate;
