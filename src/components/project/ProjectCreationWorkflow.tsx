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
  ChevronRight,
  Save
} from 'lucide-react';

// Import step components
import StakeholdersTeamStep from './steps/StakeholdersTeamStep';
import TeamContractorsStep from './steps/TeamContractorsStep';
import ResourcesMaterialsStep from './steps/ResourcesMaterialsStep';
import RiskAnalysisStep from './steps/RiskAnalysisStep';
import ProjectDocumentUpload from './ProjectDocumentUpload';
import ComplianceStep from './steps/ComplianceStep';
import ConstructionPhaseManager from './ConstructionPhaseManager';
import InteractiveMapGIS from '../materials/InteractiveMapGIS';

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
    start_date: new Date().toISOString().split('T')[0], // Default to today
    startDate: new Date().toISOString().split('T')[0],
    end_date: '',
    endDate: '',
    payment_mode: 'progressive',
    payment_frequency: 'monthly',
    initial_advance: 20,
    retention_percentage: 5,
    priority: 'medium',
    progress: 0, // Progression globale calculée
    // Project type: infrastructure | fourniture | distribution_rurale
    project_type: 'infrastructure',
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
    engineering_consultant: '',
    project_manager_id: null,
    technical_manager_id: null,
    supervisor_id: null,
    client_id: null,
    workspace_id: null,
    // Funding source fields (Bailleurs de fonds)
    financing_source: '',
    donor_organization: '',
    // Market type (Mauritania procurement)
    market_type: 'appel_offre_international',
    selection_mode: 'qualite_cout',
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
  const [phasesData, setPhasesData] = useState<any[]>([]);

  // Steps aligned with workflow specification (7 étapes critiques)
  const steps = [
    {
      id: 1,
      title: 'Informations du projet',
      icon: Building,
      description: 'Type, budget, dates, référence',
      color: 'bg-blue-500',
      isCompleted: (data: any) => Boolean(
        data.title && 
        data.description && 
        data.budget && 
        data.project_type &&
        data.start_date
      )
    },
    {
      id: 2,
      title: 'Parties prenantes',
      icon: Users,
      description: 'Bailleurs, Ministères, Entreprises, Banques, Bureau conseil',
      color: 'bg-green-500',
      isCompleted: (data: any) => Boolean(
        data.project_manager_id || 
        data.client_id ||
        data.engineering_consultant ||
        data.main_contractor
      )
    },
    {
      id: 3,
      title: 'Localisation',
      icon: MapPin,
      description: 'Géolocalisation interactive (Maps/Leaflet)',
      color: 'bg-cyan-500',
      isCompleted: (data: any) => Boolean(data.address && (data.latitude || data.longitude))
    },
    {
      id: 4,
      title: 'Planification WBS',
      icon: Layers,
      description: 'Phase → Step → Task avec documents, ressources, inspections',
      color: 'bg-indigo-500',
      isCompleted: (data: any) => Boolean(phases && phases.length > 0)
    },
    {
      id: 5,
      title: 'Risques',
      icon: AlertTriangle,
      description: 'Analyse et gestion des risques',
      color: 'bg-red-500',
      isCompleted: (data: any) => Boolean(risks && risks.length >= 0)
    },
    {
      id: 6,
      title: 'Conformité',
      icon: FileCheck,
      description: 'Standards SOMELEC et bailleurs (BM, BAD, BID, AFD)',
      color: 'bg-amber-500',
      isCompleted: (data: any) => Boolean(compliance && compliance.length >= 0)
    },
    {
      id: 7,
      title: 'Validation',
      icon: CheckCircle,
      description: 'Réception définitive et clôture',
      color: 'bg-teal-500',
      isCompleted: (data: any) => true
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

  const handleSubmit = async () => {
    // Calculer la progression globale avant soumission
    const { ProgressCalculationService } = await import('@/services/ProgressCalculationService');
    
    const calculatedProgress = ProgressCalculationService.calculateProjectProgress(
      phases,
      [], // tasks seront ajoutés après création
      [] // inspections seront ajoutés après création
    );

    // Prepare data for submission with correct field mappings
    const submitData = {
      ...formData,
      // Ensure both naming conventions are present
      startDate: formData.start_date || formData.startDate,
      endDate: formData.end_date || formData.endDate,
      start_date: formData.start_date || formData.startDate,
      end_date: formData.end_date || formData.endDate,
      progress: calculatedProgress,
      // Include all related data
      stakeholders,
      delegation,
      phases,
      materials: selectedMaterials,
      risks,
      compliance,
      shapeData
    };
    
    console.log('Submitting project data:', submitData);
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de projet *</label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                      value={formData.project_type}
                      onChange={(e) => updateFormData({ project_type: e.target.value })}
                    >
                      <option value="infrastructure">Infrastructure (HT, Postes, Centrales)</option>
                      <option value="fourniture">Fourniture (Équipements, Kits solaires)</option>
                      <option value="distribution_rurale">Distribution Rurale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget total (MRU) *</label>
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
                    <label className="block text-sm font-medium mb-2">Source de financement</label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.financing_source}
                      onChange={(e) => updateFormData({ financing_source: e.target.value })}
                    >
                      <option value="">Sélectionner</option>
                      <option value="banque_mondiale">Banque Mondiale</option>
                      <option value="bad">BAD</option>
                      <option value="bid">BID</option>
                      <option value="afd">AFD</option>
                      <option value="fmi">FMI</option>
                      <option value="fades">FADES</option>
                      <option value="bei">Banque Européenne d'Investissement</option>
                      <option value="etat_mauritanien">État Mauritanien</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de marché</label>
                    <select
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.market_type}
                      onChange={(e) => updateFormData({ market_type: e.target.value })}
                    >
                      <option value="appel_offre_international">Appel d'offre international</option>
                      <option value="appel_offre_national">Appel d'offre national</option>
                      <option value="consultation_restreinte">Consultation restreinte</option>
                      <option value="gre_a_gre">Gré à gré</option>
                    </select>
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
          <StakeholdersTeamStep
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
                <InteractiveMapGIS
                  title="Géolocalisation du Projet"
                  description="Sélectionnez l'emplacement et tracez la zone de travail"
                  allowPolygon={true}
                  value={{
                    coordinates: formData.latitude && formData.longitude 
                      ? { lat: formData.latitude, lng: formData.longitude }
                      : undefined,
                    address: formData.address,
                    shape: shapeData?.shape,
                    shapeType: shapeData?.shapeType
                  }}
                  onChange={(locationData) => {
                    // Update formData with location info
                    updateFormData({
                      address: locationData.address || formData.address,
                      latitude: locationData.coordinates?.lat || formData.latitude,
                      longitude: locationData.coordinates?.lng || formData.longitude,
                    });
                    // Store shape data separately
                    setShapeData({
                      shape: locationData.shape,
                      shapeType: locationData.shapeType
                    });
                  }}
                />
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
      
      case 4: // Planification & Phases
        return (
          <ConstructionPhaseManager
            phases={phases}
            onChange={setPhases}
            projectBudget={parseFloat(formData.budget) || 0}
          />
        );
      
      case 5: // Risks - OLD PLACEHOLDER
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Planification des Phases (Phase → Step → Task)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Configurez la structure Phase → Step → Task avec documents, ressources, inspections, garanties et paiements.
              </p>
              <ResourcesMaterialsStep
                formData={formData}
                onUpdate={updateFormData}
                selectedMaterials={selectedMaterials}
                onMaterialsChange={onMaterialsChange}
              />
            </CardContent>
          </Card>
        );
      
      case 5: // Risques
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      
      case 6: // Conformité
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
          />
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
                <Button
                  variant="outline"
                  onClick={() => {
                    // Save current step without navigating
                    console.log('Saving step data:', formData);
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
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
                    onClick={nextStep}
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