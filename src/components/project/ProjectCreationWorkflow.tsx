import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Layers,
  MapPin,
  Save,
  Users,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";

// Import step components
import InteractiveMapGIS from "../materials/InteractiveMapGIS";

// Define Coordinate interface locally since it's not exported
interface Coordinate {
  lat: number;
  lng: number;
}
import ConstructionPhaseManager from "./ConstructionPhaseManager";
import ComplianceStep from "./steps/ComplianceStep";
import ResourcesMaterialsStep from "./steps/ResourcesMaterialsStep";
import RiskAnalysisStep from "./steps/RiskAnalysisStep";
import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// 🏗️ Hexagonal Architecture Imports
import { useProjectWorkflowHex } from "@/hooks/hexagonal/useProjectWorkflowHex";
import { ProjectService } from '@/application/services/ProjectService';
import { ProjectFormService } from '@/application/services/ProjectFormService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { CreateProjectRequestDTO } from "@/dtos/entities/ProjectDTO";

interface ProjectCreationWorkflowProps {
  onSubmit: (data: CreateProjectRequestDTO) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (
    materials: Array<{ materialId: string; quantity: number }>
  ) => void;
  initialData?: CreateProjectRequestDTO;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData,
}) => {
  // ⚡ Application Layer - Hook hexagonal pour la gestion du workflow
  const {
    saveStep,
    completeWorkflow,
    getWorkflowProgress,
    validateCurrentStep: hookValidateCurrentStep,
  } = useProjectWorkflowHex();

  // 🔧 Infrastructure Layer - Service hexagonal pour la gestion des projets
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

  // 🎨 UI Layer - États locaux pour la présentation uniquement (Règle PROMPTS.md #5)
  const [currentStep, setCurrentStep] = useState(0);

  // 🎨 UI Layer - Use basic object state (transformers removed)
  // 🎨 UI Layer - Use basic object state with CreateProjectRequestDTO (no duplicate keys)
  const [projectData, setProjectData] = useState<CreateProjectRequestDTO>(() => ({
    title: "",
    description: "",
    location: "",
    address: "",
    latitude: 0,
    longitude: 0,
    budget: 0,
    startDate: "",
    endDate: "",
    projectManagerId: "",
    clientId: "",
    status: "en attente",
    priority: "Moyenne",
    estimatedDuration: 0,
    // Legacy snake_case for backward compatibility
    start_date: "",
    end_date: "",
    project_manager_id: "",
    client_id: "",
    estimated_duration: 0,
    // Additional fields
    technical_manager_id: "",
    supervisor_id: "",
    client_name: "",
    project_reference: "",
    project_type: "",
    sector: "",
    permit_number: "",
    payment_mode: "progressive",
    payment_frequency: "monthly",
    initial_advance: 20,
    retention_percentage: 5,
    currency: "MRU",
    funding_source: "",
    market_type: "",
    selection_mode: "",
    main_contractor: "",
    // UI-specific fields
    progress: 0,
    thumbnail: "",
    teamSize: 0,
    reception_status: "",
    closure_notes: "",
    ...initialData
  }));

  // 🎨 UI Layer - États locaux pour les données associées (transformers removed)
  const [stakeholders, setStakeholders] = useState<Array<{id: string; name: string; role: string; contact: string}>>([]);
  const [delegation, setDelegation] = useState({
    projectManager: "",
    technicalManager: "",
    supervisor: "",
    client: "",
  });
  const [risks, setRisks] = useState<Array<{id: string; title: string; severity: 'low' | 'medium' | 'high'; description: string}>>([]);
  const [compliance, setCompliance] = useState<Array<{id: string; standard: string; status: 'pending' | 'completed'; document: string}>>([]);
  const [phases, setPhases] = useState<Array<{id: string; name: string; status: string; progress: number}>>([]);
  const [shapeDataState, setShapeDataState] = useState<{
    shape: Coordinate[] | undefined;
    shapeType: 'polygon' | 'rectangle' | 'circle' | 'diamond' | undefined;
  } | null>(null);
  const [phasesData, setPhasesData] = useState<Array<{id: string; name: string; status: string; progress: number}>>([]);
  const [estimatedDuration, setEstimatedDuration] = useState(
    projectData.estimatedDuration || ""
  );

  // 🎨 UI Layer - Update function for basic state (transformers removed)
  const updateProjectData = useCallback((updates: Partial<CreateProjectRequestDTO>) => {
    setProjectData((prev) => ({ ...prev, ...updates }));
  }, []);

  // 🎨 UI Layer - Use project data directly (Rule #5 compliant)
  const flattenedProjectData = useMemo(() => projectData, [projectData]);

  // 🔧 Memoize update functions to prevent unnecessary re-renders
  const memoizedUpdateProjectData = useMemo(() => updateProjectData, [updateProjectData]);

  // 🎨 UI Layer - Use service for validation (Rule #5 compliant)
  const validateStepData = useCallback((): { isValid: boolean; errors: string[] } => {
    // 🚀 Delegate validation to service layer (hexagonal flow)
    const projectFormService = new ProjectFormService();
    const validation = projectFormService.validateStepData(flattenedProjectData, currentStep);
    
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }, [flattenedProjectData, currentStep]);

  // Steps aligned with workflow specification (7 étapes critiques)
  // 🎨 UI Layer - Options de statut pour l'affichage (PROMPTS.md Rule #5)
  const statusOptions = [
    { value: "en cours", label: "En cours" },
    { value: "terminé", label: "Terminé" },
    { value: "en attente", label: "En attente" },
    { value: "suspendu", label: "Suspendu" },
    { value: "annulé", label: "Annulé" },
  ] as const;

  // Steps aligned with workflow specification (7 étapes critiques)
  const steps = [
    {
      id: 1,
      title: "Informations du projet",
      icon: Building,
      description: "Type, budget, dates, référence",
      color: "bg-blue-500",
      isCompleted: (data: CreateProjectRequestDTO) =>
        Boolean(
          data.title &&
          data.description &&
          data.estimated_budget &&
          data.project_type &&
          data.start_date
        ),
    },
    {
      id: 2,
      title: "Parties prenantes",
      icon: Users,
      description:
        "Bailleurs, Ministères, Entreprises, Banques, Bureau conseil",
      color: "bg-green-500",
      isCompleted: (data: CreateProjectRequestDTO) =>
        Boolean(data.technical_manager_id),
    },
    {
      id: 3,
      title: "Localisation",
      icon: MapPin,
      description: "Géolocalisation interactive (Maps/Leaflet)",
      color: "bg-cyan-500",
      isCompleted: (data: CreateProjectRequestDTO) =>
        Boolean(data.address && (data.latitude || data.longitude)),
    },
    {
      id: 4,
      title: "Planification WBS",
      icon: Layers,
      description:
        "Phase → Step → Task avec documents, ressources, inspections",
      color: "bg-indigo-500",
      isCompleted: (data: CreateProjectRequestDTO) => Boolean(phases && phases.length > 0),
    },
    {
      id: 5,
      title: "Risques",
      icon: AlertTriangle,
      description: "Analyse et gestion des risques",
      color: "bg-red-500",
      isCompleted: (data: CreateProjectRequestDTO) => Boolean(risks && risks.length >= 0),
    },
    {
      id: 6,
      title: "Conformité",
      icon: FileCheck,
      description: "Standards SOMELEC et bailleurs (BM, BAD, BID, AFD)",
      color: "bg-amber-500",
      isCompleted: (data: CreateProjectRequestDTO) => Boolean(compliance && compliance.length >= 0),
    },
    {
      id: 7,
      title: "Validation",
      icon: CheckCircle,
      description: "Réception définitive et clôture",
      color: "bg-teal-500",
      isCompleted: (data: CreateProjectRequestDTO) => true,
    },
  ];

  // 🎨 UI Layer - Manual step saving with validation (respect user workflow)
  const saveCurrentStep = async () => {
    // 🚀 Use service validation (hexagonal flow)
    const validation = validateStepData();
    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      toast({
        title: "Erreur de validation",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    try {
      // 🎨 UI Layer - Delegate to service layer
      const projectFormService = new ProjectFormService();
      const result = await projectFormService.saveStep(currentStep, flattenedProjectData);
      
      if (result.success) {
        toast({
          title: "Sauvegarde réussie",
          description: `Étape ${currentStep + 1} sauvegardée avec succès`,
        });
        return true;
      } else {
        toast({
          title: "Erreur de sauvegarde",
          description: result.error || "Échec de la sauvegarde",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
      return false;
    }
  };

  // 🎨 UI Layer - Save and proceed to next step with error handling
  const saveAndNextStep = async () => {
    // Validate current step before proceeding
    if (!canProceedNext()) {
      console.warn('Veuillez compléter l\'étape actuelle avant de continuer');
      return; // 🚫 Do not proceed if validation fails
    }

    // Attempt to save current step
    const saveSuccess = await saveCurrentStep();
    if (!saveSuccess) {
      console.error('Échec de la sauvegarde, passage à l\'étape suivante annulé');
      return; // 🚫 Do not proceed if save fails
    }

    // Only proceed if save was successful
    nextStep();
  };

  // 🎨 UI Layer - Save all workflow data with error handling
  const saveAllData = async () => {
    try {
      const workflowData: ProjectWorkflowData = {
        currentStep: currentStep + 1,
        isDraft: true,
        isComplete: false,
        projectData: projectData,
        relatedData: {
          materials: selectedMaterials || [],
          phases: phases || [],
          risks: risks || [],
          compliance: compliance || {
            regulations: [],
            certifications: [],
            standards: [],
            status: 'pending',
            documents: []
          },
        },
        metadata: {
          lastSavedAt: new Date().toISOString(),
          totalSteps: 7,
          completedSteps: currentStep + 1,
          progressPercentage: getWorkflowProgress(),
          stepName: steps[currentStep]?.title || `Étape ${currentStep + 1}`,
        },
      };

      await saveStep(workflowData);
      console.log('Toutes les données du workflow sauvegardées');
      return true; // ✅ Success
    } catch (error) {
      console.error('Erreur lors de la sauvegarde complète:', error);
      // 🚫 Flash saving prevented - do not commit on error
      return false; // ❌ Failed
    }
  };


  const getStepProgress = () => {
    const completedCount = steps.filter((step) =>
      step.isCompleted(projectData)
    ).length;
    return (completedCount / steps.length) * 100;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedNext = () => {
    const step = steps[currentStep];
    // ✅ Use project data for validation (consistent with step validation)
    return step ? step.isCompleted(projectData) : false;
  };

  const handleSubmit = async () => {
    // � Use service for final validation (hexagonal flow)
    const projectFormService = new ProjectFormService();
    const validation = projectFormService.validateStepData(flattenedProjectData, 7); // Final validation
    
    if (!validation.isValid) {
      console.error('Final validation failed:', validation.errors);
      toast({
        title: "Erreur de validation finale",
        description: "Veuillez compléter toutes les étapes requises avant de créer le projet: " + validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    try {
      // 🎨 UI Layer - Delegate to service layer
      const result = await projectFormService.completeProjectCreation(
        '', // ID will be generated by service
        flattenedProjectData
      );
      
      if (result.success) {
        toast({
          title: "Projet créé avec succès",
          description: "Le projet a été créé et toutes les étapes sont complétées",
        });
        
        // � Navigate to project detail
        if (result.projectId) {
          window.location.href = `/projects/${result.projectId}`;
        }
      } else {
        toast({
          title: "Erreur de création",
          description: result.error || "Échec de la création du projet",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Project creation failed:', error);
      toast({
        title: "Erreur de création",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    }
  };

  const calculateDatesFromDuration = (durationDays: number) => {
    const startDate = new Date(projectData.start_date || new Date());
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Informations Générales du Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Titre du projet *
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nom du projet de construction"
                      required
                      value={projectData.title}
                      onChange={(e) =>
                        updateProjectData({ title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Référence du projet
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="REF-2025-001"
                      value={projectData.project_reference}
                      onChange={(e) =>
                        updateProjectData({ project_reference: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mode de paiement *
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={projectData.payment_mode || ""}
                      onChange={(e) =>
                        updateProjectData({ payment_mode: e.target.value })
                      }
                    >
                      <option value="">
                        Sélectionner le mode de paiement
                      </option>
                      <option value="progressive">
                        Paiement progressif
                      </option>
                      <option value="milestone">
                        Paiement par jalon
                      </option>
                      <option value="completion">
                        Paiement à l\'achèvement
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fréquence de paiement *
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={projectData.payment_frequency || ""}
                      onChange={(e) =>
                        updateProjectData({ payment_frequency: e.target.value })
                      }
                    >
                      <option value="">
                        Sélectionner la fréquence
                      </option>
                      <option value="monthly">
                        Mensuel
                      </option>
                      <option value="quarterly">
                        Trimestriel
                      </option>
                      <option value="milestone">
                        Par jalon
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description détaillée *
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    placeholder="Description complète du projet, objectifs et spécifications techniques"
                    required
                    value={projectData.description}
                    onChange={(e) =>
                      updateProjectData({ description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type de projet *
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={projectData.project_type}
                      onChange={(e) =>
                        updateProjectData({ project_type: e.target.value })
                      }
                    >
                      <option value="">
                        Sélectionner le type de projet
                      </option>
                      <option value="infrastructure">
                        Infrastructure (HT, Postes, Centrales)
                      </option>
                      <option value="fourniture">
                        Fourniture (Équipements, Kits solaires)
                      </option>
                      <option value="distribution_rurale">
                        Distribution Rurale
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Secteur *
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={projectData.project_type?.sector || ""}
                      onChange={(e) =>
                        updateProjectData({ 
                          project_type: {
                            ...projectData.project_type,
                            sector: e.target.value
                          }
                        })
                      }
                    >
                      <option value="">
                        Sélectionner le secteur
                      </option>
                      <option value="energie">
                        Énergie
                      </option>
                      <option value="eau">
                        Eau
                      </option>
                      <option value="telecommunications">
                        Télécommunications
                      </option>
                      <option value="construction">
                        Construction
                      </option>
                      <option value="transport">
                        Transport
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Budget total (MRU) *
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1000000"
                      required
                      value={projectData.budget}
                      onChange={(e) =>
                        updateProjectData({ budget: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Durée estimée (jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="365"
                      value={estimatedDuration}
                      onChange={(e) => {
                        const duration = e.target.value;
                        setEstimatedDuration(duration);

                        if (duration && projectData.start_date) {
                          const calculatedDates = calculateDatesFromDuration(
                            parseInt(duration)
                          );
                          updateProjectData({
                            estimatedBudget: parseInt(duration),
                            end_date: calculatedDates.endDate,
                          });
                        } else {
                          updateProjectData({
                            estimatedBudget: duration ? parseInt(duration) : 0,
                            end_date: "",
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Source de financement
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={projectData.funding_source}
                      onChange={(e) =>
                        updateProjectData({ funding_source: e.target.value })
                      }
                    >
                      <option value="">Sélectionner</option>
                      <option value="banque_mondiale">Banque Mondiale</option>
                      <option value="bad">BAD</option>
                      <option value="bid">BID</option>
                      <option value="afd">AFD</option>
                      <option value="fmi">FMI</option>
                      <option value="fades">FADES</option>
                      <option value="bei">
                        Banque Européenne d'Investissement
                      </option>
                      <option value="etat_mauritanien">État Mauritanien</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Type de marché
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={projectData.market_type}
                      onChange={(e) =>
                        updateProjectData({ market_type: e.target.value })
                      }
                    >
                      <option value="appel_offre_international">
                        Appel d'offre international
                      </option>
                      <option value="appel_offre_national">
                        Appel d'offre national
                      </option>
                      <option value="consultation_restreinte">
                        Consultation restreinte
                      </option>
                      <option value="gre_a_gre">Gré à gré</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={projectData.start_date}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        updateProjectData({
                          start_date: startDate,
                        });

                        // Recalculer la date de fin si la durée est définie
                        if (estimatedDuration && startDate) {
                          const calculatedDates = calculateDatesFromDuration(
                            parseInt(estimatedDuration)
                          );
                          updateProjectData({
                            end_date: calculatedDates.endDate,
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={projectData.end_date}
                      onChange={(e) =>
                        updateProjectData({ end_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 1: // Stakeholders
        return (
          <StakeholdersTeamStep 
            projectData={flattenedProjectData} 
            onUpdate={memoizedUpdateProjectData} 
          />
        );

      case 2: // Location
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-500" />
                Localisation et Géographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <InteractiveMapGIS
                  title="Géolocalisation du Projet"
                  description="Sélectionnez l'emplacement et tracez la zone de travail"
                  allowPolygon={true}
                  value={{
                    coordinates:
                      projectData.latitude && projectData.longitude
                        ? { lat: projectData.latitude, lng: projectData.longitude }
                        : undefined,
                    address: projectData.address,
                    shape: shapeDataState?.shape,
                    shapeType: shapeDataState?.shapeType,
                  }}
                  onChange={(locationData) => {
                    // Update projectData with location info
                    updateProjectData({
                      address: locationData.address || projectData.address,
                      latitude:
                        locationData.coordinates?.lat || projectData.latitude,
                      longitude:
                        locationData.coordinates?.lng || projectData.longitude,
                    });
                    // Store shape data separately
                    setShapeDataState({
                      shape: locationData.shape || undefined,
                      shapeType: locationData.shapeType,
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 3: // Planification WBS (Phases, Steps, Tasks with Resources)
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Planification WBS Complète
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Construction Phase Manager for Phase → Step → Task structure */}
              <ConstructionPhaseManager
                phases={phases}
                onChange={setPhases}
                projectBudget={parseFloat(projectData.budget) || 0}
              />

              {/* Resources and Materials integrated within phase planning */}
              <ResourcesMaterialsStep
                formData={projectData}
                onUpdate={updateProjectData}
                selectedMaterials={selectedMaterials}
                onMaterialsChange={onMaterialsChange}
              />
            </CardContent>
          </Card>
        );

      case 4: // Risks
        return (
          <RiskAnalysisStep formData={projectData} onUpdate={updateProjectData} />
        );

      case 5: // Compliance
        return <ComplianceStep formData={projectData} onUpdate={updateProjectData} />;

      case 6: // Validation & Closure
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-teal-500" />
                Validation et Conformité Finale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground mb-4">
                Dernière étape: réception définitive, solde et clôture du projet
              </p>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Statut de réception
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                    value=""
                    onChange={(e) =>
                      updateProjectData({ reception_status: e.target.value })
                    }
                  >
                    <option value="">Sélectionner</option>
                    <option value="provisional">Réception provisoire</option>
                    <option value="definitive">Réception définitive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes de clôture
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary min-h-[100px]"
                    placeholder="Notes finales, observations, recommandations..."
                    value=""
                    onChange={(e) =>
                      updateProjectData({ closure_notes: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">
              Création de Projet - Étape {currentStep + 1} sur {steps.length}
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {Math.round(getStepProgress())}% complété
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </CardHeader>
      </Card>

      {/* Navigation Steps */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Panel - Steps Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = step.isCompleted(projectData);
              const isActive = currentStep === index;
              const canAccess = index <= currentStep || isCompleted;

              return (
                <motion.div
                  key={step.id}
                  whileHover={{ scale: canAccess ? 1.02 : 1 }}
                  whileTap={{ scale: canAccess ? 0.98 : 1 }}
                >
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      isActive && "ring-2 ring-primary shadow-lg",
                      isCompleted && "border-green-500 bg-green-50",
                      !canAccess && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => canAccess && setCurrentStep(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-full text-white flex-shrink-0 relative",
                            step.color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {isCompleted && (
                            <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 text-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{step.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Step Content */}
        <div className="lg:col-span-4">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const success = await saveCurrentStep();
                    if (!success) {
                      // 🚫 Flash saving prevented - show error feedback
                      console.error('Sauvegarde échouée, veuillez réessayer');
                    }
                  }}
                  disabled={!canProceedNext()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    const success = await saveAllData();
                    if (!success) {
                      // 🚫 Flash saving prevented - show error feedback
                      console.error('Sauvegarde complète échouée, veuillez réessayer');
                    }
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Tout sauvegarder
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Créer le projet
                  </Button>
                ) : (
                  <Button 
                    onClick={saveAndNextStep} 
                    disabled={!canProceedNext()}
                  >
                    Sauvegarder et suivant
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;
