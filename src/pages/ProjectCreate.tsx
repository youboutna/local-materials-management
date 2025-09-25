
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
import ProjectFormWithMap from '@/components/project/ProjectFormWithMap';
import MaterialFormSection from '@/components/MaterialFormSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhaseService } from '@/services/phaseService';
import OrganizationalHierarchyManager from '@/components/admin/OrganizationalHierarchyManager';
import { Building, Users, UserCheck, Shield } from 'lucide-react';

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
        location: data.location,
        status: mappedStatus as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: 0,
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
        mainContractor: data.main_contractor,
        engineeringConsultant: data.engineering_consultant,
        projectReference: data.project_reference,
        allowsInitialPayment: data.allows_initial_payment,
        initialPaymentPercentage: data.initial_payment_percentage,
        // Construction workflow fields - ensuring proper type casting
        currentPhase: data.current_phase,
        currentStage: data.current_stage,
        // Localization fields
        localisation: localizationData,
        forme: shapeType,
        adresse: addressData
      };

      const projectResult = await createProject(projectData);
      
      // Save construction phases if any are defined
      if (data.phases && data.phases.length > 0 && projectResult?.id) {
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
      if (selectedMaterials.length > 0 && projectResult?.id) {
        await addMaterialsToProject(projectResult.id, selectedMaterials);
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
            className="max-w-6xl mx-auto space-y-6"
          >
            {/* Project Creation Workflow */}
            <div className="bg-white rounded-xl shadow-elegant p-6">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">{t("project_create.title")}</h1>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Projet & GIS
                  </TabsTrigger>
                  <TabsTrigger value="stakeholders" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Parties Prenantes
                  </TabsTrigger>
                  <TabsTrigger value="delegation" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Délégation
                  </TabsTrigger>
                  <TabsTrigger value="organization" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Organisation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <ProjectFormWithMap 
                    onSubmit={handleFormSubmit}
                  />
                </TabsContent>

                <TabsContent value="stakeholders">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-adrar-800">
                        Parties Prenantes du Projet
                      </CardTitle>
                      <p className="text-gray-600">
                        Identifiez et configurez les parties prenantes principales du projet.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="text-sm text-gray-500">
                          Configuration des parties prenantes (à implémenter)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="delegation">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-adrar-800">
                        Délégation de Réalisation du Projet
                      </CardTitle>
                      <p className="text-gray-600">
                        Configurez la délégation selon les trois profils principaux : Employés, Bureaux d'études, Entreprises de construction.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Employés (Personnel Interne)</h4>
                            <p className="text-sm text-gray-600">
                              Responsables du suivi et inspection pour assurer la conformité.
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Bureaux d'Études</h4>
                            <p className="text-sm text-gray-600">
                              Conseil, contrôle, études de faisabilité et assistance technique.
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">Entreprises de Construction</h4>
                            <p className="text-sm text-gray-600">
                              Réalisation physique des travaux et infrastructures.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="organization">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-adrar-800">
                        Hiérarchie Organisationnelle & Matériaux
                      </CardTitle>
                      <p className="text-gray-600">
                        Définissez la structure hiérarchique et sélectionnez les matériaux nécessaires.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <OrganizationalHierarchyManager />
                      
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Sélection des matériaux</h3>
                        <MaterialFormSection
                          selectedMaterials={selectedMaterials}
                          onChange={setSelectedMaterials}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectCreate;
