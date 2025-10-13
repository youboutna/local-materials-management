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
import LocationStep from './steps/LocationStep';
import RiskAnalysisStep from './steps/RiskAnalysisStep';
import ComplianceStep from './steps/ComplianceStep';
import ConstructionPhaseManager from './ConstructionPhaseManager';

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
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);
  const [baseData, setBaseData] = useState<any>({});
  const [phasesData, setPhasesData] = useState<any[]>([]);

  // Initialize ProjectFormService
  const formService = new ProjectFormService();

  // Load project data from database if no initialData
  const loadProjectData = useCallback(async () => {
    if (!projectId || hasLoadedData || (initialData && Object.keys(initialData).length > 0)) return;
    
    setIsLoading(true);
    try {
      const projectData = await formService.loadProjectData(projectId);
      if (projectData) {
        setFormData(projectData);
        setHasLoadedData(true);
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
  }, [projectId, hasLoadedData, initialData, formService, toast]);

  // Load related data (stakeholders, phases, etc.)
  const loadRelatedData = useCallback(async () => {
    if (!projectId || hasLoadedData) return;
    
    try {
      const relatedData = await formService.loadRelatedData(projectId);
      setFormData(prev => ({ ...prev, ...relatedData }));
      
      if (relatedData.materials) {
        setSelectedMaterials(relatedData.materials);
      }
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  }, [projectId, hasLoadedData, formService]);

  // Load base data for dropdowns
  const loadBaseData = useCallback(async () => {
    try {
      const data = await formService.loadBaseData();
      setBaseData(data);
    } catch (error) {
      console.error('Error loading base data:', error);
    }
  }, [formService]);

  // Update form data when initialData changes - ONLY ONCE
  useEffect(() => {
    if (hasLoadedData) return; // Prevent reloading
    
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
      setHasLoadedData(true);
    } else if (!hasLoadedData) {
      loadProjectData();
    }
  }, [initialData, hasLoadedData, loadProjectData, formService]);

  // Load related data and base data on mount - ONLY ONCE
  useEffect(() => {
    if (!hasLoadedData && projectId) {
      loadRelatedData();
      loadBaseData();
    }
  }, [projectId]); // Only trigger when projectId changes, not on function changes

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
        toast({
          title: 'Étape sauvegardée',
          description: `Passage à l'étape ${currentStep + 1}: ${steps[currentStep]?.title}`,
        });
      } else {
        toast({
          title: 'Toutes les étapes complétées',
          description: 'Vous avez terminé toutes les étapes du projet.',
        });
      }
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

  // Step configuration aligned with workflow spec (7 steps)
  const steps = [
    {
      id: 1,
      title: 'Informations du projet',
      icon: Building,
      description: 'Données de base du projet',
      color: 'bg-blue-500',
      isCompleted: () => formService.validateStep(1, formData)
    },
    {
      id: 2,
      title: 'Parties prenantes',
      icon: Users,
      description: 'Configuration des acteurs',
      color: 'bg-green-500',
      isCompleted: () => formService.validateStep(2, formData)
    },
    {
      id: 3,
      title: 'Localisation',
      icon: MapPin,
      description: 'Géolocalisation et cartographie',
      color: 'bg-cyan-500',
      isCompleted: () => formService.validateStep(3, formData)
    },
    {
      id: 4,
      title: 'Planification & Phases',
      icon: Layers,
      description: 'Phase → Step → Task (documents, ressources, inspections, garanties, paiements)',
      color: 'bg-indigo-500',
      isCompleted: () => formService.validateStep(4, formData)
    },
    {
      id: 5,
      title: 'Risques',
      icon: AlertTriangle,
      description: 'Gestion des risques globaux et des phases',
      color: 'bg-red-500',
      isCompleted: () => formService.validateStep(5, formData)
    },
    {
      id: 6,
      title: 'Conformité',
      icon: FileCheck,
      description: 'Vérification réglementaire et normes',
      color: 'bg-amber-500',
      isCompleted: () => formService.validateStep(6, formData)
    },
    {
      id: 7,
      title: 'Validation & Clôture',
      icon: CheckCircle,
      description: 'Réception définitive, solde, clôture',
      color: 'bg-teal-500',
      isCompleted: () => formService.validateStep(7, formData)
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Informations du projet
        return (
          <ProjectInfoStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
            baseData={baseData}
          />
        );
      case 2: // Parties prenantes
        return (
          <StakeholdersTeamStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
            baseData={baseData}
          />
        );
      case 3: // Localisation
        return (
          <LocationStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 4: // Planification & Phases (Phase → Step → Task)
        return (
          <ConstructionPhaseManager
            phases={phasesData}
            onChange={setPhasesData}
            projectBudget={formData.estimatedBudget || formData.estimated_budget || 0}
          />
        );
      case 5: // Risques
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 6: // Conformité
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 7: // Validation & Clôture
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-teal-500" />
                Validation et Conformité Finale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Dernière étape: réception définitive, solde et clôture du projet
              </p>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Statut de réception
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                    value={formData.reception_status || ''}
                    onChange={(e) => updateFormData({ reception_status: e.target.value })}
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
                    value={formData.closure_notes || ''}
                    onChange={(e) => updateFormData({ closure_notes: e.target.value })}
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
                    disabled={currentStep === 1 || isSaving}
                  >
                    Précédent
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveStepOnly}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                  
                  {currentStep < steps.length && (
                    <Button
                      onClick={handleSaveAndNext}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder et suivant'}
                    </Button>
                  )}
                  
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