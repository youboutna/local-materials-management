
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import ProjectCreationWorkflow from '@/components/project/ProjectCreationWorkflow';
import { PhaseService } from '@/services/phaseService';
import { ProjectStakeholderService } from '@/services/ProjectStakeholderService';

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const { createProject } = useProjects();

  // Status mapping from form values to database values
  const statusMapping = {
    'Planning': 'en attente',
    'InProgress': 'en cours',
    'Pending': 'en attente',
    'OnHold': 'suspendu',
    'Completed': 'terminé',
    'Cancelled': 'annulé'
  } as const;

  // Handle form submission from ProjectFormWithMap
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
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
      
      // Create the new project with all the form data
      const projectData = {
        title: data.title,
        description: data.description,
        location: data.shapeData?.address || data.location || 'Non spécifié',
        status: mappedStatus as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: 0,
        budget: parseFloat(data.budget) || 0,
        estimated_days: parseInt(data.estimatedDays) || null,
        currency: data.currency || 'MRU',
        payment_mode: data.paymentMode || 'progressive',
        payment_frequency: data.paymentFrequency || 'monthly',
        initial_advance_percentage: data.initialAdvance || 20,
        retention_percentage: data.retentionPercentage || 5,
        priority: data.priority || 'medium',
        project_type: data.projectType || 'construction',
        sector: data.sector,
        permit_number: data.permitNumber,
        startDate: data.startDate,
        endDate: data.endDate,
        thumbnail: '/img/project-placeholder.jpg',
        teamSize: data.team_size || 1,
        coordinates: projectCoordinates,
        financingSource: data.financing_source,
        marketType: data.market_type,
        selectionMode: data.selection_mode,
        projectResponsableId: data.delegation?.projectManager,
        mainContractor: data.main_contractor,
        engineeringConsultant: data.engineering_consultant,
        projectReference: data.reference,
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        // Construction workflow fields - ensuring proper type casting
        currentPhase: data.current_phase,
        currentStage: data.current_stage,
        // Localization fields
        localisation: localizationData,
        forme: shapeType,
        adresse: data.shapeData?.address
      };

      const projectResult = await createProject(projectData);
      
      if (projectResult?.id) {
        // Save project stakeholders
        if (data.stakeholders || data.delegation) {
          try {
            await ProjectStakeholderService.createProjectStakeholders(
              projectResult.id,
              data.stakeholders || [],
              data.delegation || {}
            );
            toast({
              title: "Parties prenantes sauvegardées",
              description: "Les parties prenantes du projet ont été configurées.",
            });
          } catch (stakeholderError) {
            console.error('Error saving stakeholders:', stakeholderError);
            toast({
              title: "Avertissement",
              description: "Projet créé mais erreur lors de la sauvegarde des parties prenantes.",
              variant: "destructive",
            });
          }
        }

        // Save construction phases if any are defined
        if (data.phases && data.phases.length > 0) {
          try {
            await PhaseService.saveProjectPhases(projectResult.id, data.phases);
            toast({
              title: "Phases sauvegardées",
              description: `${data.phases.length} phase(s) de construction sauvegardée(s).`,
            });
          } catch (phaseError) {
            console.error('Error saving phases:', phaseError);
            toast({
              title: "Avertissement",
              description: `Projet créé mais erreur lors de la sauvegarde des phases: ${phaseError instanceof Error ? phaseError.message : 'Erreur inconnue'}`,
              variant: "destructive",
            });
          }
        }
        
        // Add materials to the project if any are selected
        if (selectedMaterials.length > 0) {
          await addMaterialsToProject(projectResult.id, selectedMaterials);
        }
      }
      
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

  // This function is now handled by PhaseService

  // Add materials to project and create automatic quantity takeoffs
  const addMaterialsToProject = async (projectId: string, materials: SelectedMaterial[]) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Add materials to project_materials table
      const materialsToAdd = materials.map(material => ({
        project_id: projectId,
        material_id: material.materialId,
        quantity: material.quantity
      }));

      const { error: materialsError } = await supabase
        .from('project_materials')
        .insert(materialsToAdd);

      if (materialsError) throw materialsError;

      // Automatically create quantity takeoffs for each material
      const takeoffsToCreate = materials.map(material => ({
        project_id: projectId,
        material_id: material.materialId,
        element_type: 'Standard Element',
        unit: 'unité', // Default unit
        length: material.quantity,
        width: null,
        height: null,
        note: 'Auto-généré lors de la création du projet'
      }));

      const { error: takeoffsError } = await supabase
        .from('quantity_takeoffs')
        .insert(takeoffsToCreate);

      if (takeoffsError) throw takeoffsError;

      toast({
        title: "Matériaux ajoutés",
        description: `${materials.length} matériau(x) et métré(s) créé(s) automatiquement.`,
      });
    } catch (error) {
      console.error('Error adding materials to project:', error);
      toast({
        title: "Avertissement",
        description: "Projet créé mais erreur lors de l'ajout des matériaux.",
        variant: "destructive",
      });
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
            className="max-w-7xl mx-auto space-y-6"
          >
            {/* Enhanced Project Creation Workflow */}
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h1 className="text-3xl font-serif text-adrar-800 mb-2">{t("project_create.title")}</h1>
              <p className="text-gray-600 mb-8">
                Suivez ce processus structuré pour créer votre projet de manière optimale
              </p>
              
              <ProjectCreationWorkflow
                onSubmit={handleFormSubmit}
                selectedMaterials={selectedMaterials}
                onMaterialsChange={setSelectedMaterials}
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
