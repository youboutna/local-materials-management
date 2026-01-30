import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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
import React, { useState, useEffect, useMemo } from "react";

// Import DTOs for type safety
import { 
  ProjectFormDataDTO, 
  ProjectWorkflowData, 
  WorkflowMetadataDTO,
  StepRelatedDataDTO,
  TaskFormDataDTO,
  InspectionFormDataDTO,
  ComplianceDataDTO
} from "@/dtos/transforms/ProjectWorkflowDTOs";

// Import step components
import InteractiveMapGIS from "../materials/InteractiveMapGIS";
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

// Import des types et services existants
import { useProjectWorkflowHex, type ProjectWorkflowData } from "@/hooks/hexagonal/useProjectWorkflowHex";
import { ProjectTransformer } from "@/dtos/transforms/ProjectTransformer";
import { ProjectService, type ProjectFormDataDTO } from "@/application/services/ProjectService";
import { CreateProjectRequestDTO } from "@/dtos/entities/ProjectDTO";
import { Project } from "@/domain/entities/Project";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

interface ProjectCreationWorkflowProps {
  onSubmit: (data: ProjectFormDataDTO) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (
    materials: Array<{ materialId: string; quantity: number }>
  ) => void;
  initialData?: ProjectFormDataDTO;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData,
}) => {
  // Hook hexagonal pour la gestion du workflow (logique métier déléguée)
  const {
    saveStep,
    completeWorkflow,
    isSaving,
    getWorkflowProgress,
    isStepCompleted,
    canProceedToNext,
    validateCurrentStep,
    calculateDatesFromDuration,
    getStepProgress,
  } = useProjectWorkflowHex();

  // Service hexagonal pour la gestion des projets
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

  // Données du projet avec types corrects
  const [projectData, setProjectData] = useState<ProjectFormDataDTO>(() => ({
    title: '',
    description: '',
    location: '',
    status: 'planifié',
    progress: 0,
    budget: 0,
    start_date: new Date().toISOString().split("T")[0],
    end_date: '',
    team_size: 0,
    // Champs additionnels pour compatibilité
    phases: [],
    materials: [],
    risks: [],
    bankGuarantees: [],
    insurances: [],
    documents: [],
    employees: [],
    suppliers: [],
    tasks: [],
    inspections: [],
    compliance: {
      regulations: [],
      certifications: [],
      standards: [],
      status: 'pending',
      documents: []
    },
    estimatedBudget: 0
  }));

  // Étapes du workflow avec useMemo pour éviter les re-renders
  const steps = useMemo(() => [
    {
      id: 1,
      title: "Informations générales",
      description: "Détails de base du projet",
      icon: Building,
      component: null, // Sera rendu directement
    },
    {
      id: 2,
      title: "Localisation",
      description: "Emplacement et zone du projet",
      icon: MapPin,
      component: InteractiveMapGIS,
    },
    {
      id: 3,
      title: "Phases de construction",
      description: "Planification des phases",
      icon: Layers,
      component: ConstructionPhaseManager,
    },
    {
      id: 4,
      title: "Ressources et matériaux",
      description: "Allocation des ressources",
      icon: Users,
      component: ResourcesMaterialsStep,
    },
    {
      id: 5,
      title: "Analyse des risques",
      description: "Identification et mitigation",
      icon: AlertTriangle,
      component: RiskAnalysisStep,
    },
    {
      id: 6,
      title: "Parties prenantes",
      description: "Équipe et collaborateurs",
      icon: Users,
      component: StakeholdersTeamStep,
    },
    {
      id: 7,
      title: "Conformité",
      description: "Réglementations et certifications",
      icon: FileCheck,
      component: ComplianceStep,
    },
  ], []);

  // États locaux pour la présentation uniquement (Règle PROMPTS.md #5)
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState("");

  // Auto-sauvegarde lors des changements avec sauvegarde par étape
  useEffect(() => {
    const saveWorkflowData = async () => {
      if (projectData.title && projectData.description) {
        try {
          // Sauvegarde par étape via le hook hexagonal
          const workflowData: ProjectWorkflowData = {
            currentStep: currentStep + 1,
            isDraft: true,
            isComplete: false,
            projectData: projectData,
            relatedData: {
              // Données associées à cette étape
              materials: projectData.materials || selectedMaterials || [],
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
          console.log(`Étape ${currentStep + 1} sauvegardée automatiquement`);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde automatique:', error);
        }
      }
    };

    const timeoutId = setTimeout(saveWorkflowData, 2000); // Auto-sauvegarde après 2s
    return () => clearTimeout(timeoutId);
  }, [projectData, currentStep, saveStep, getWorkflowProgress, selectedMaterials, steps]);

  // Steps aligned with workflow specification (7 étapes critiques)
  const steps = [
    {
      id: 1,
      title: "Informations du projet",
      icon: Building,
      description: "Type, budget, dates, référence",
      color: "bg-blue-500",
      isCompleted: () => Boolean(
        projectData.title &&
        projectData.description &&
        projectData.budget &&
        projectData.startDate
      ),
    },
    {
      id: 2,
      title: "Parties prenantes",
      icon: Users,
      description:
        "Bailleurs, Ministères, Entreprises, Banques, Bureau conseil",
      color: "bg-green-500",
      isCompleted: () => Boolean(
        projectData.delegation.projectManager ||
        projectData.delegation.client ||
        projectData.stakeholders.length > 0
      ),
    },
    {
      id: 3,
      title: "Localisation",
      icon: MapPin,
      description: "Géolocalisation interactive (Maps/Leaflet)",
      color: "bg-cyan-500",
      isCompleted: () => Boolean(projectData.location),
    },
    {
      id: 4,
      title: "Planification WBS",
      icon: Layers,
      description:
        "Phase → Step → Task avec documents, ressources, inspections",
      color: "bg-indigo-500",
      isCompleted: () => Boolean(projectData.phases && projectData.phases.length > 0),
    },
    {
      id: 5,
      title: "Risques",
      icon: AlertTriangle,
      description: "Analyse et gestion des risques",
      color: "bg-red-500",
      isCompleted: () => Boolean(projectData.risks && projectData.risks.length >= 0),
    },
    {
      id: 6,
      title: "Conformité",
      icon: FileCheck,
      description: "Standards SOMELEC et bailleurs (BM, BAD, BID, AFD)",
      color: "bg-amber-500",
      isCompleted: () => Boolean(projectData.compliance && projectData.compliance.length >= 0),
    },
    {
      id: 7,
      title: "Validation",
      icon: CheckCircle,
      description: "Réception définitive et clôture",
      color: "bg-teal-500",
      isCompleted: () => true,
    },
  ];

  // Sauvegarde manuelle de l'étape actuelle
  const saveCurrentStep = async () => {
    try {
      const workflowData: ProjectWorkflowData = {
        currentStep: currentStep + 1,
        isDraft: true,
        isComplete: false,
        projectData: projectData as Record<string, unknown>,
        relatedData: {
          // Données spécifiques à l'étape actuelle
          ...(currentStep === 0 && {
            basicInfo: {
              title: projectData.title,
              description: projectData.description,
              budget: projectData.budget,
              dates: {
                start: projectData.start_date,
                end: projectData.end_date,
              },
            },
          }),
          ...(currentStep === 1 && {
            stakeholders: projectData.stakeholders || [],
          }),
          ...(currentStep === 2 && {
            location: {
              address: projectData.address,
              coordinates: {
                latitude: projectData.latitude,
                longitude: projectData.longitude,
              },
            },
          }),
          ...(currentStep === 3 && {
            phases: projectData.phases || [],
          }),
          ...(currentStep === 4 && {
            risks: projectData.risks || [],
          }),
          ...(currentStep === 5 && {
            compliance: projectData.compliance || [],
          }),
          materials: projectData.materials || selectedMaterials || [],
        },
        metadata: {
          lastSavedAt: new Date().toISOString(),
          totalSteps: 7,
          completedSteps: currentStep + 1,
          progressPercentage: getWorkflowProgress(),
          stepName: steps[currentStep]?.title || `Étape ${currentStep + 1}`,
          stepType: 'manual_save',
        },
      };

      const result = await saveStep(workflowData);
      
      if (result.success) {
        console.log(`Étape ${currentStep + 1} sauvegardée manuellement avec succès`);
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde manuelle:', error);
      throw error;
    }
  };

  const updateProjectData = (updates: Partial<ProjectFormDataDTO>) => {
    setProjectData((prev) => ({ ...prev, ...updates }));
  };

  // Navigation avec sauvegarde automatique
  const nextStepWithSave = async () => {
    if (canProceedNext()) {
      // Sauvegarder l'étape actuelle avant de passer à la suivante
      await saveCurrentStep();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStepWithSave = async () => {
    if (currentStep > 0) {
      // Sauvegarder l'étape actuelle avant de revenir en arrière
      await saveCurrentStep();
      setCurrentStep(currentStep - 1);
    }
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
    return step ? step.isCompleted() : false;
  };

  const handleSubmit = async () => {
    try {
      console.log("Submitting project data:", projectData);
      
      // Transformer les données du formulaire en entité de domaine
      const createProjectDTO: CreateProjectRequestDTO = {
        title: projectData.title,
        description: projectData.description,
        budget: projectData.budget,
        startDate: projectData.start_date || projectData.startDate,
        endDate: projectData.end_date || projectData.endDate,
        location: projectData.location || projectData.address,
        latitude: projectData.latitude,
        longitude: projectData.longitude,
        projectManagerId: projectData.technical_manager_id,
        clientId: projectData.client_name,
        status: projectData.status as 'planifié' | 'en cours' | 'terminé' | 'suspendu' | 'annulé',
        priority: 'medium',
        estimatedDuration: parseInt(projectData.estimatedDuration?.toString() || '0'),
        // Champs additionnels
        projectType: projectData.project_type,
        sector: projectData.sector,
        permitNumber: projectData.permit_number,
        paymentMode: projectData.payment_mode,
        paymentFrequency: projectData.payment_frequency,
        initialAdvance: projectData.initial_advance,
        retentionPercentage: projectData.retention_percentage,
        currency: projectData.currency,
        financingSource: projectData.financingSource || projectData.funding_source,
        marketType: projectData.marketType || projectData.market_type,
        selectionMode: projectData.selectionMode || projectData.selection_mode,
        mainContractor: projectData.main_contractor,
        createdBy: 'current-user', // À adapter avec l'auth
      };

      // Créer le projet via le service hexagonal
      const projectEntity = ProjectTransformer.fromCreateDTOToEntity(createProjectDTO);
      const savedProject = await projectService.createProject(projectEntity);
      
      // Finaliser le workflow
      const workflowData: ProjectWorkflowData = {
        currentStep: 7,
        isDraft: false,
        isComplete: true,
        projectData: projectData as Record<string, unknown>,
        relatedData: {
          // Données associées (objets intégrés) - gérées par le service
        },
        metadata: {
          lastSavedAt: new Date().toISOString(),
          totalSteps: 7,
          completedSteps: 7,
          progressPercentage: 100,
        },
      };

      const result = await completeWorkflow(workflowData);
      
      if (result.success) {
        onSubmit(projectData);
      }
    } catch (error) {
      console.error("Error submitting project:", error);
    }
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
                    <label className="text-sm font-medium">Status *</label>
                    <Select
                      value={projectData.status ?? undefined}
                      required
                      onValueChange={(value) =>
                        updateProjectData({ status: value })
                      }
                    >
                      <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <SelectValue placeholder="Sélectionner le status" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start">
                        {statusOptions.map((status) => (
                          <SelectItem
                            key={status.value}
                            value={status.value}
                            className="cursor-pointer"
                          >
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Progress *
                    </label>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <Progress
                        value={projectData.progress || 0}
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {projectData.progress || 0}%
                      </span>
                    </div>

                    {/* Input */}
                    <input
                      type="number"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                      min={0}
                      max={100}
                      required
                      value={projectData.progress || ""}
                      onChange={(e) =>
                        updateProjectData({
                          progress: parseInt(e.target.value) || 0,
                        })
                      }
                    />
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
                      Budget total (MRU) *
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1000000"
                      required
                      value={projectData.budget}
                      onChange={(e) =>
                        updateProjectData({ budget: parseFloat(e.target.value) || 0 })
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
                            estimated_duration_days: duration,
                            end_date: calculatedDates.endDate,
                            endDate: calculatedDates.endDate,
                          });
                        } else {
                          updateProjectData({
                            estimated_duration_days: duration,
                            end_date: "",
                            endDate: "",
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
                      value={projectData.financing_source}
                      onChange={(e) =>
                        updateProjectData({ financing_source: e.target.value })
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
                          startDate: startDate,
                        });

                        if (estimatedDuration) {
                          const calculatedDates = calculateDatesFromDuration(
                            parseInt(estimatedDuration)
                          );
                          updateProjectData({
                            end_date: calculatedDates.endDate,
                            endDate: calculatedDates.endDate,
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
          <StakeholdersTeamStep projectData={projectData} onUpdate={updateProjectData} />
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
                    shape: projectData.shapeData?.type,
                    shapeType: projectData.shapeData?.type,
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
                    updateProjectData({
                      shapeData: {
                        ...projectData.shapeData,
                        type: locationData.shapeType || '',
                        coordinates: locationData.shape?.coordinates || [],
                      },
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
                phases={projectData.phases}
                onChange={(phases) => updateProjectData({ phases })}
                projectBudget={projectData.budget || 0}
              />

              {/* Resources and Materials integrated within phase planning */}
              <ResourcesMaterialsStep
                projectData={projectData}
                onUpdate={updateProjectData}
                selectedMaterials={selectedMaterials}
                onMaterialsChange={onMaterialsChange}
              />
            </CardContent>
          </Card>
        );

      case 4: // Risks
        return (
          <RiskAnalysisStep projectData={projectData} onUpdate={updateProjectData} />
        );

      case 5: // Compliance
        return (
          <ComplianceStep projectData={projectData} onUpdate={updateProjectData} />
        );

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
                    value={projectData.reception_status || ""}
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
                    value={projectData.closure_notes || ""}
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
              {Math.round(getStepProgressLocal())}% complété
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
              const isCompleted = step.isCompleted();
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;
