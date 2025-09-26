import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';
import {
  Building, Users, UserCheck, Layers, MapPin, Package, 
  Clock, DollarSign, CheckCircle, Target, Edit2, Save,
  AlertTriangle, FileCheck
} from 'lucide-react';

// Import services
import { ProjectFormService, ProjectFormData, SaveContext } from '../../services/ProjectFormService';

// Import step components
import ProjectInfoStep from './steps/ProjectInfoStep';
import StakeholdersTeamStep from './steps/StakeholdersTeamStep';
import PhasePlanificationStep from './steps/PhasePlanificationStep';
import LocationStep from './steps/LocationStep';
import RiskAnalysisStep from './steps/RiskAnalysisStep';
import ComplianceStep from './steps/ComplianceStep';

interface EnhancedProjectEditFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onFormDataChange?: (data: any) => void;
}

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange
}) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>(() => initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);

  // Initialize ProjectFormService
  const formService = new ProjectFormService();

  // Load project data from database if no initialData
  const loadProjectData = useCallback(async () => {
    if (!projectId || (initialData && Object.keys(initialData).length > 0)) return;
    
    setIsLoading(true);
    try {
      const projectData = await formService.loadProjectData(projectId);
      if (projectData) {
        setFormData(projectData);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données du projet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, initialData, formService, toast]);

  // Load related data (stakeholders, phases, etc.)
  const loadRelatedData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const relatedData = await formService.loadRelatedData(projectId);
      setFormData(prev => ({ ...prev, ...relatedData }));
      
      if (relatedData.materials) {
        setSelectedMaterials(relatedData.materials);
      }
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  }, [projectId, formService]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const processedData = {
        ...initialData,
        startDate: formService.formatDateForInput(initialData.startDate || initialData.start_date),
        endDate: formService.formatDateForInput(initialData.endDate || initialData.end_date),
        start_date: formService.formatDateForInput(initialData.startDate || initialData.start_date),
        end_date: formService.formatDateForInput(initialData.endDate || initialData.end_date),
        status: initialData.status ? formService.mapStatusFromDB(initialData.status) : 'planning'
      };
      setFormData(processedData);
      
      // Extract materials if provided
      if (initialData.materials) {
        setSelectedMaterials(initialData.materials);
      }
    } else {
      loadProjectData();
    }
  }, [initialData, loadProjectData, formService]);

  // Load related data on mount
  useEffect(() => {
    loadRelatedData();
  }, [loadRelatedData]);

  // Update form data helper
  const updateFormData = (updates: any) => {
    const updatedData = { ...formData, ...updates };
    setFormData(updatedData);
    if (onFormDataChange) {
      onFormDataChange(updatedData);
    }
  };

  // Save handlers with distinct behavior
  const handleSaveStepOnly = async () => {
    if (!onSubmit) return;
    
    setIsSaving(true);
    try {
      const context: SaveContext = {
        currentStep,
        saveType: 'step_only',
        isDraft: true
      };
      
      const processedData = formService.processFormDataForSave({
        ...formData,
        materials: selectedMaterials
      }, context);
      
      await onSubmit(processedData);
      
      toast({
        title: 'Étape sauvegardée',
        description: 'Les données de cette étape ont été sauvegardées.',
      });
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde de l\'étape.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!onSubmit) return;
    
    // Validate current step before proceeding
    const isValid = formService.validateStep(currentStep, formData);
    if (!isValid) {
      toast({
        title: 'Validation échouée',
        description: 'Veuillez compléter les champs requis avant de continuer.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const context: SaveContext = {
        currentStep,
        saveType: 'save_and_next',
        isDraft: true
      };
      
      const processedData = formService.processFormDataForSave({
        ...formData,
        materials: selectedMaterials
      }, context);
      
      await onSubmit(processedData);
      
      // Move to next step if not at the end
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
      
      toast({
        title: 'Étape sauvegardée',
        description: 'Passage à l\'étape suivante.',
      });
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGlobalAndClose = async () => {
    if (!onSubmit) return;
    
    setIsSaving(true);
    try {
      const context: SaveContext = {
        currentStep,
        saveType: 'global_and_close',
        isDraft: false,
        isComplete: true
      };
      
      const processedData = formService.processFormDataForSave({
        ...formData,
        materials: selectedMaterials
      }, context);
      
      await onSubmit(processedData);
      
      toast({
        title: 'Projet sauvegardé',
        description: 'Toutes les modifications ont été sauvegardées.',
      });
      
      // Navigate back or close form
      window.history.back();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde globale.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Step configuration with merged stakeholders and team
  const steps = [
    {
      id: 1,
      title: 'Informations Générales',
      icon: Building,
      description: 'Données de base du projet (titre, description, budget)',
      color: 'bg-blue-500',
      isCompleted: () => formService.validateStep(1, formData)
    },
    {
      id: 2,
      title: 'Parties Prenantes & Équipe',
      icon: Users,
      description: 'Acteurs, responsabilités, équipe interne et contractants',
      color: 'bg-green-500',
      isCompleted: () => formService.validateStep(2, formData)
    },
    {
      id: 3,
      title: 'Phases & Planification',
      icon: Layers,
      description: 'Structure des phases, chronologie et matériaux',
      color: 'bg-indigo-500',
      isCompleted: () => formService.validateStep(3, formData) && selectedMaterials.length > 0
    },
    {
      id: 4,
      title: 'Géolocalisation',
      icon: MapPin,
      description: 'Localisation précise et délimitation des zones',
      color: 'bg-cyan-500',
      isCompleted: () => formService.validateStep(4, formData)
    },
    {
      id: 5,
      title: 'Analyse des Risques',
      icon: AlertTriangle,
      description: 'Analyse et mitigation des risques projet',
      color: 'bg-red-500',
      isCompleted: () => formService.validateStep(5, formData)
    },
    {
      id: 6,
      title: 'Conformités & Validation',
      icon: FileCheck,
      description: 'Respect des normes et validation finale',
      color: 'bg-teal-500',
      isCompleted: () => formService.validateStep(6, formData)
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectInfoStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 2:
        return (
          <StakeholdersTeamStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 3:
        return (
          <PhasePlanificationStep
            formData={formData}
            onUpdate={updateFormData}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            isEditing={true}
          />
        );
      case 4:
        return (
          <LocationStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 5:
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 6:
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      default:
        return null;
    }
  };

  // Calculate overall progress
  const completedSteps = steps.filter(step => step.isCompleted()).length;
  const overallProgress = (completedSteps / steps.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Édition du Projet: {formData.title || 'Nouveau Projet'}
            </span>
            <Badge variant="outline" className="px-3 py-1">
              Étape {currentStep} / {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progression globale</span>
              <span className="font-semibold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              {completedSteps} étapes complétées sur {steps.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Steps */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all duration-200",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : step.isCompleted()
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  )}
                  onClick={() => setCurrentStep(step.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      currentStep === step.id
                        ? "bg-primary-foreground text-primary"
                        : step.isCompleted()
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    )}>
                      {step.isCompleted() ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {step.title}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>

          {/* Action Buttons */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveStepOnly}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder cette étape'}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveAndNext}
                    disabled={isSaving || currentStep === steps.length}
                  >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder et suivant'}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleSaveGlobalAndClose}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder et fermer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectEditForm;