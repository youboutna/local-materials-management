import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/projects/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectFormWithMap from '@/components/project/ProjectFormWithMap';
import MaterialFormSection from '@/components/MaterialFormSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PhaseService } from '@/services/phaseService';


// Add interface for selected materials
interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, updateProject } = useProjects();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [initialData, setInitialData] = useState<any>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        const projectData = await getProject(id);
        if (projectData) {
          // Map status to form format
          const statusMapping = {
            'en attente': 'Planning',
            'en cours': 'InProgress', 
            'suspendu': 'OnHold',
            'terminé': 'Completed',
            'annulé': 'Cancelled'
          } as const;

          // Prepare initial data for the form
          const formInitialData = {
            title: projectData.title,
            description: projectData.description,
            location: projectData.location,
            status: statusMapping[projectData.status as keyof typeof statusMapping] || 'Planning',
            budget: projectData.budget,
            start_date: projectData.startDate,
            end_date: projectData.endDate,
            team_size: projectData.teamSize,
            financing_source: projectData.financingSource || '',
            market_type: projectData.marketType || '',
            selection_mode: projectData.selectionMode || '',
            project_responsable_id: projectData.projectResponsableId || '',
            main_contractor: projectData.mainContractor || '',
            project_reference: projectData.projectReference || '',
            allows_initial_payment: projectData.allowsInitialPayment || false,
            initial_payment_percentage: projectData.initialPaymentPercentage || 0,
            current_phase: (projectData as any).currentPhase || '',
            current_stage: (projectData as any).currentStage || '',
            facilitiesLocation: projectData.coordinates ? {
              center: {
                lat: projectData.coordinates.latitude,
                lng: projectData.coordinates.longitude
              }
            } : undefined
          };

          setInitialData(formInitialData);

          // Load project materials
          await loadProjectMaterials(id);
        } else {
          toast({
            title: t("projects.edit.error"),
            description: t("projects.edit.not_found"),
            variant: "destructive",
          });
          navigate('/projects');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: t("projects.edit.error"),
          description: t("projects.edit.load_error"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, getProject, navigate, t]);

  // Load existing materials when project loads
  const loadProjectMaterials = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_materials')
        .select('material_id, quantity')
        .eq('project_id', projectId);

      if (error) throw error;

      const materials: SelectedMaterial[] = data?.map(item => ({
        materialId: item.material_id,
        quantity: item.quantity
      })) || [];

      setSelectedMaterials(materials);
    } catch (error) {
      console.error('Error loading project materials:', error);
    }
  };


  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      // Status mapping from form values to database values
      const statusMapping = {
        'Planning': 'en attente',
        'InProgress': 'en cours',
        'Pending': 'en attente',
        'OnHold': 'suspendu',
        'Completed': 'terminé',
        'Cancelled': 'annulé'
      } as const;

      // Prepare coordinates for the API
      const projectCoordinates = data.facilitiesLocation?.center ? {
        latitude: data.facilitiesLocation.center.lat,
        longitude: data.facilitiesLocation.center.lng
      } : undefined;
      
      // Map the status from form to database value
      const mappedStatus = statusMapping[data.status as keyof typeof statusMapping] || 'en attente';
      
      // Update the project with all the form data
      const projectDataToUpdate = {
        title: data.title,
        description: data.description,
        location: data.location,
        status: mappedStatus as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        budget: data.budget,
        startDate: data.start_date,
        endDate: data.end_date,
        teamSize: data.team_size,
        coordinates: projectCoordinates,
        financingSource: data.financing_source,
        marketType: data.market_type,
        selectionMode: data.selection_mode,
        projectResponsableId: data.project_responsable_id,
        mainContractor: data.main_contractor,
        projectReference: data.project_reference,
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        currentPhase: data.current_phase,
        currentStage: data.current_stage
      };

      const updatedProject = await updateProject(id, projectDataToUpdate);
      if (updatedProject) {
        // Update materials
        await updateProjectMaterials(id, selectedMaterials);

        // Save construction phases if any are defined
        if (data.phases && data.phases.length > 0) {
          try {
            await PhaseService.saveProjectPhases(id, data.phases);
            toast({
              title: "Phases sauvegardées",
              description: `${data.phases.length} phase(s) de construction mise(s) à jour.`,
            });
          } catch (phaseError) {
            console.error('Error saving phases:', phaseError);
            toast({
              title: "Avertissement",
              description: `Erreur lors de la sauvegarde des phases: ${phaseError instanceof Error ? phaseError.message : 'Erreur inconnue'}`,
              variant: "destructive",
            });
          }
        }

        toast({
          title: t("projects.edit.saved"),
          description: t("projects.edit.saved_desc"),
        });
        navigate(`/projects/${id}`);
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: t("projects.edit.error"),
        description: t("projects.edit.save_error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // This function is now handled by PhaseService

  // Update materials in database
  const updateProjectMaterials = async (projectId: string, materials: SelectedMaterial[]) => {
    try {
      // Delete existing materials
      await supabase
        .from('project_materials')
        .delete()
        .eq('project_id', projectId);

      // Insert new materials
      if (materials.length > 0) {
        const materialsToInsert = materials.map(material => ({
          project_id: projectId,
          material_id: material.materialId,
          quantity: material.quantity
        }));

        const { error } = await supabase
          .from('project_materials')
          .insert(materialsToInsert);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating project materials:', error);
      throw error;
    }
  };

  if (loading || !initialData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-96">
              <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to={`/projects/${id}`}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("projects.edit.back_to_detail")}
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Project Form */}
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">{t("projects.edit.title")}</h1>
              
              <ProjectFormWithMap 
                onSubmit={handleFormSubmit}
                initialData={initialData}
              />
            </div>

            {/* Materials Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-serif text-adrar-800">
                  Sélection des matériaux
                </CardTitle>
                <p className="text-gray-600">
                  Modifiez les matériaux nécessaires pour ce projet.
                </p>
              </CardHeader>
              <CardContent>
                <MaterialFormSection
                  selectedMaterials={selectedMaterials}
                  onChange={setSelectedMaterials}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectEdit;
