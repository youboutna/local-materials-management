import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Building, 
  Users, 
  UserCheck, 
  Shield, 
  MapPin,
  AlertTriangle,
  FileCheck,
  Layers,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import step components
import StakeholdersStep from './steps/StakeholdersStep';
import TeamContractorsStep from './steps/TeamContractorsStep';
import ResourcesMaterialsStep from './steps/ResourcesMaterialsStep';
import RiskAnalysisStep from './steps/RiskAnalysisStep';
import ComplianceStep from './steps/ComplianceStep';

interface ProjectCreationWorkflowProps {
  onSubmit: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  initialData?: any;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic info matching database schema
    title: '',
    project_reference: '',
    description: '',
    budget: '',
    estimated_duration_days: '',
    currency: 'MRU',
    status: 'planning',
    start_date: '',
    end_date: '',
    payment_mode: 'progressive',
    payment_frequency: 'monthly',
    initial_advance: 20,
    retention_percentage: 5,
    priority: 'medium',
    project_type: 'construction',
    sector: '',
    permit_number: '',
    // Location data
    address: '',
    latitude: null,
    longitude: null,
    area_sqm: null,
    site_details: '',
    // Financial data
    advance_percentage: 20,
    // Additional fields to match database
    client_name: '',
    main_contractor: '',
    project_manager_id: null,
    technical_manager_id: null,
    supervisor_id: null,
    client_id: null,
    workspace_id: null,
    ...initialData
  });

  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [delegation, setDelegation] = useState<any>({
    projectManager: '',
    technicalManager: '',
    supervisor: '',
    client: ''
  });
  const [risks, setRisks] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [shapeData, setShapeData] = useState<any>(null);

  const steps = [
    {
      id: 1,
      title: 'Informations du projet',
      icon: Building,
      description: 'Données de base du projet',
      color: 'bg-blue-500',
      isCompleted: (data: any) => Boolean(data.title && data.description && data.budget)
    },
    {
      id: 2,
      title: 'Parties prenantes',
      icon: Users,
      description: 'Configuration des acteurs',
      color: 'bg-green-500',
      isCompleted: (data: any) => Boolean(data.project_manager_id || data.client_id)
    },
    {
      id: 3,
      title: 'Localisation',
      icon: MapPin,
      description: 'Géolocalisation et cartographie',
      color: 'bg-cyan-500',
      isCompleted: (data: any) => Boolean(data.address)
    },
    {
      id: 4,
      title: 'Phases',
      icon: Layers,
      description: 'Planification des phases',
      color: 'bg-indigo-500',
      isCompleted: (data: any) => Boolean(phases.length > 0)
    },
    {
      id: 5,
      title: 'Matériaux',
      icon: Package,
      description: 'Ressources et matériaux',
      color: 'bg-purple-500',
      isCompleted: (data: any) => Boolean(selectedMaterials.length > 0)
    },
    {
      id: 6,
      title: 'Risques',
      icon: AlertTriangle,
      description: 'Gestion des risques',
      color: 'bg-red-500',
      isCompleted: (data: any) => Boolean(risks.length > 0)
    },
    {
      id: 7,
      title: 'Conformité',
      icon: FileCheck,
      description: 'Validation et conformité',
      color: 'bg-teal-500',
      isCompleted: (data: any) => Boolean(compliance.length > 0)
    }
  ];

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const getStepProgress = () => {
    const completedCount = steps.filter(step => step.isCompleted(formData)).length;
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
    return step ? step.isCompleted(formData) : false;
  };

  const handleSubmit = () => {
    // Prepare data for submission with correct field mappings
    const submitData = {
      ...formData,
      stakeholders,
      delegation,
      phases,
      materials: selectedMaterials,
      risks,
      compliance,
      shapeData
    };
    onSubmit(submitData);
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
                    <label className="block text-sm font-medium mb-2">Titre du projet *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nom du projet de construction"
                      required
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Référence du projet</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="REF-2025-001"
                      value={formData.project_reference}
                      onChange={(e) => updateFormData({ project_reference: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description détaillée *</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    placeholder="Description complète du projet, objectifs et spécifications techniques"
                    required
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget total *</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1000000"
                      required
                      value={formData.budget}
                      onChange={(e) => updateFormData({ budget: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Durée estimée (jours)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="365"
                      value={formData.estimated_duration_days}
                      onChange={(e) => updateFormData({ estimated_duration_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date de début</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.start_date}
                      onChange={(e) => updateFormData({ start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date de fin</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.end_date}
                      onChange={(e) => updateFormData({ end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 1: // Stakeholders
        return (
          <StakeholdersStep
            formData={formData}
            onUpdate={updateFormData}
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
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Adresse du projet"
                    value={formData.address}
                    onChange={(e) => updateFormData({ address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Latitude</label>
                    <input 
                      type="number" 
                      step="any"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="18.0735"
                      value={formData.latitude || ''}
                      onChange={(e) => updateFormData({ latitude: parseFloat(e.target.value) || null })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Longitude</label>
                    <input 
                      type="number" 
                      step="any"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="-15.9582"
                      value={formData.longitude || ''}
                      onChange={(e) => updateFormData({ longitude: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      case 3: // Phases
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Planification des Phases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Les phases seront configurées après la création du projet.
              </p>
              <Button 
                onClick={() => setPhases([{ name: 'Phase initiale', description: 'Phase de démarrage' }])}
                variant="outline"
              >
                Ajouter une phase par défaut
              </Button>
            </CardContent>
          </Card>
        );
      
      case 4: // Materials
        return (
          <ResourcesMaterialsStep
            formData={formData}
            onUpdate={updateFormData}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={onMaterialsChange}
          />
        );
      
      case 5: // Risks
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      
      case 6: // Compliance
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
          />
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
              const isCompleted = step.isCompleted(formData);
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
                        <div className={cn(
                          "p-2 rounded-full text-white flex-shrink-0 relative",
                          step.color
                        )}>
                          <Icon className="h-4 w-4" />
                          {isCompleted && (
                            <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 text-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{step.title}</h3>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
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
                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={handleSubmit}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Créer le projet
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                    disabled={!canProceedNext()}
                  >
                    Suivant
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