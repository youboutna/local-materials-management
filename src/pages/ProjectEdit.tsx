import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/projects/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectFormWithMap from '@/components/project/ProjectFormWithMap';
import MaterialFormSection from '@/components/MaterialFormSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PhaseService } from '@/services/phaseService';
import OrganizationalHierarchyManager from '@/components/admin/OrganizationalHierarchyManager';
import { Building, Users, UserCheck, Shield } from 'lucide-react';
import EnhancedProjectEditForm from '../components/project/EnhancedProjectEditForm';


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

          // Load project phases first
          const phases = await loadProjectPhases(id);
          
          // Safe date formatting helper
          const formatDateForInput = (dateString: any) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return '';
              return date.toISOString().split('T')[0];
            } catch (error) {
              console.warn('Date formatting error:', error);
              return '';
            }
          };

          // Prepare initial data for the form including phases
          const formInitialData = {
            title: projectData.title,
            description: projectData.description,
            location: projectData.location,
            status: statusMapping[projectData.status as keyof typeof statusMapping] || 'Planning',
            budget: projectData.budget,
            // Use safe date formatting for both legacy and new field names
            startDate: formatDateForInput(projectData.startDate),
            endDate: formatDateForInput(projectData.endDate),
            start_date: formatDateForInput(projectData.startDate),
            end_date: formatDateForInput(projectData.endDate),
            team_size: projectData.teamSize || 1, // Default to 1 instead of 0
            financing_source: projectData.financingSource || '',
            market_type: projectData.marketType || '',
            selection_mode: projectData.selectionMode || '',
            project_responsable_id: projectData.projectResponsableId || '',
            main_contractor: projectData.mainContractor || '',
            engineering_consultant: (projectData as any).engineeringConsultant || '',
            project_reference: projectData.projectReference || '',
            allows_initial_payment: projectData.allowsInitialPayment || false,
            initial_payment_percentage: projectData.initialPaymentPercentage || 0,
            current_phase: (projectData as any).currentPhase || '',
            current_stage: (projectData as any).currentStage || '',
            phases: phases || [], // Include phases from the start
            facilitiesLocation: projectData.coordinates ? {
              center: {
                lat: projectData.coordinates.latitude,
                lng: projectData.coordinates.longitude
              },
              polygon: Array.isArray((projectData as any).localisation) ? (projectData as any).localisation : [],
              warehouseShape: Array.isArray((projectData as any).localisation) ? (projectData as any).localisation : [],
              address: typeof (projectData as any).adresse === 'string' ? (projectData as any).adresse : ((projectData as any).adresse?.address || ''),
              shapeType: (projectData as any).forme || undefined
            } : {
              polygon: Array.isArray((projectData as any).localisation) ? (projectData as any).localisation : [],
              warehouseShape: Array.isArray((projectData as any).localisation) ? (projectData as any).localisation : [],
              address: typeof (projectData as any).adresse === 'string' ? (projectData as any).adresse : ((projectData as any).adresse?.address || ''),
              shapeType: (projectData as any).forme || undefined
            }
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

  // Load existing phases when project loads
  const loadProjectPhases = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      // Transform phases data for the form
      const phases = data?.map(phase => ({
        id: phase.id,
        title: phase.phase_name,
        description: phase.description || '',
        startDate: phase.start_date,
        endDate: phase.end_date,
        estimatedDuration: phase.estimated_duration || 30,
        status: phase.status,
        budget: phase.estimated_cost || 0,
        actualCost: phase.actual_cost || 0,
        progress: phase.progress || 0,
        materials: Array.isArray(phase.materials) ? phase.materials : [],
        humanResources: Array.isArray(phase.human_resources) ? phase.human_resources : [],
        suppliers: Array.isArray(phase.suppliers) ? phase.suppliers : [],
        location: phase.location || '',
        notes: phase.notes || ''
      })) || [];

      return phases;
    } catch (error) {
      console.error('Error loading project phases:', error);
      return [];
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

      // Prepare coordinates and localization data for the API
      const projectCoordinates = data.facilitiesLocation?.center ? {
        latitude: data.facilitiesLocation.center.lat,
        longitude: data.facilitiesLocation.center.lng
      } : undefined;
      
      // Prepare localization data
      const localizationData = data.facilitiesLocation?.polygon || data.facilitiesLocation?.warehouseShape || [];
      const shapeType = data.facilitiesLocation?.shapeType || (data.facilitiesLocation?.polygon?.length > 0 ? 'polygon' : undefined);
      const addressData = data.facilitiesLocation?.address;
      
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
        engineeringConsultant: data.engineering_consultant,
        projectReference: data.project_reference,
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        currentPhase: data.current_phase,
        currentStage: data.current_stage,
        // Localization fields
        localisation: localizationData,
        forme: shapeType,
        adresse: addressData
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

       // Context-aware toast
       if (data.saveType === 'step_only') {
         toast({ title: 'Étape sauvegardée', description: 'Les données de cette étape ont été enregistrées.' });
       } else if (data.saveType === 'save_and_next') {
         toast({ title: 'Étape sauvegardée', description: 'Poursuivez vers la prochaine étape.' });
       } else {
         toast({ title: t("projects.edit.saved"), description: t("projects.edit.saved_desc") });
       }
        // Navigate only when explicitly closing the workflow
        if (data.saveType === 'global_and_close' || data.isComplete) {
          navigate(`/projects/${id}`);
        }
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
      <div className="layout-main bg-gray-50">
        <Navbar />
        <main className="layout-content">
          <div className="container-responsive">
            <div className="flex justify-center items-center h-64 sm:h-96">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="layout-main bg-gray-50">
      <Navbar />
      
      <main className="layout-content">
        <div className="container-responsive">
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
            className="max-w-7xl mx-auto card-stack"
          >
            {/* Project Edit Workflow */}
            <div className="bg-white rounded-xl shadow-mobile card-responsive">
              <h1 className="heading-responsive font-serif text-adrar-800 mb-4 sm:mb-6">{t("projects.edit.title")}</h1>
              
              <EnhancedProjectEditForm 
                initialData={{
                  ...initialData,
                  materials: selectedMaterials
                }}
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

export default ProjectEdit;
