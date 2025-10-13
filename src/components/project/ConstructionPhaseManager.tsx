import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  Package, 
  Building,
  Settings,
  Eye,
  AlertCircle
} from 'lucide-react';
import { ConstructionPhase, ConstructionStage } from '@/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DEV_MODE } from '@/config/constants';
import { referentialService, ReferentialType } from '@/config/referentials';

// Define types for procurement phases and stages
export type ProcurementPhase =
  | 'planification'
  | 'publicite'
  | 'reception_analyse'
  | 'attribution'
  | 'controle_regulation';

export type ProcurementStage =
  | 'estimation_ressources'
  | 'planification_achats'
  | 'modalites_planification'
  | 'publication_portail'
  | 'diffusion_journaux'
  | 'inscription_candidats'
  | 'notification_opportunites'
  | 'soumission_dossiers'
  | 'analyse_cpmp'
  | 'assistance_sous_commission'
  | 'evaluation_conformite'
  | 'selection_prix'
  | 'choix_economique'
  | 'publication_attribution'
  | 'signature_marche'
  | 'controle_cncmp'
  | 'verification_regulier'
  | 'regulation_armp'
  | 'commission_disciplinaire';

// Mauritanian public procurement workflow stages mapping
export const PROCUREMENT_STAGES: {
  [key in ProcurementPhase]: { value: ProcurementStage; label: string }[]
} = {
  planification: [
    { value: 'estimation_ressources', label: 'Estimation des ressources financières nécessaires' },
    { value: 'planification_achats', label: 'Planification des achats par catégorie (personnel, locations, assurances, etc.)' },
    { value: 'modalites_planification', label: 'Définition des modalités de planification' }
  ],
  publicite: [
    { value: 'publication_portail', label: 'Publication via le Portail National des Marchés Publics' },
    { value: 'diffusion_journaux', label: 'Diffusion dans les journaux d\'annonces légales' },
    { value: 'inscription_candidats', label: 'Inscription des candidats potentiels sur le portail' },
    { value: 'notification_opportunites', label: 'Notifications d\'opportunités aux candidats' }
  ],
  reception_analyse: [
    { value: 'soumission_dossiers', label: 'Soumission des dossiers techniques par les candidats' },
    { value: 'analyse_cpmp', label: 'Analyse par la CPMP présidée par la PRMP' },
    { value: 'assistance_sous_commission', label: 'Assistance de la sous-commission d\'analyse des offres' },
    { value: 'evaluation_conformite', label: 'Évaluation de la conformité des offres' }
  ],
  attribution: [
    { value: 'selection_prix', label: 'Sélection basée sur le critère du prix ou du coût' },
    { value: 'choix_economique', label: 'Choix de l\'offre économiquement la plus avantageuse' },
    { value: 'publication_attribution', label: 'Publication de l\'avis d\'attribution dans les 30 jours' },
    { value: 'signature_marche', label: 'Signature du marché avec l\'attributaire' }
  ],
  controle_regulation: [
    { value: 'controle_cncmp', label: 'Contrôle a priori et a posteriori par la CNCMP' },
    { value: 'verification_regulier', label: 'Vérification de la régularité des procédures' },
    { value: 'regulation_armp', label: 'Régulation par l\'ARMP (Conseil de Régulation, Commission de Règlement des Différends)' },
    { value: 'commission_disciplinaire', label: 'Commission Disciplinaire pour les sanctions' }
  ]
};

// Standard construction stages mapping
const CONSTRUCTION_STAGES: { [key in ConstructionPhase]: { value: ConstructionStage; label: string }[] } = {
  pre_construction: [
    { value: 'planning_design', label: 'Planification et conception' },
    { value: 'permits_approvals', label: 'Permis et approbations' }
  ],
  site_preparation: [
    { value: 'site_clearing', label: 'Déblayage du site' },
    { value: 'excavation', label: 'Excavation' }
  ],
  foundation: [
    { value: 'foundation_work', label: 'Travaux de fondation' }
  ],
  framing: [
    { value: 'structural_framing', label: 'Charpente structurelle' }
  ],
  structural_work: [
    { value: 'roofing', label: 'Toiture' },
    { value: 'electrical_plumbing', label: 'Électricité et plomberie' }
  ],
  finishing: [
    { value: 'interior_finishing', label: 'Finitions intérieures' },
    { value: 'exterior_finishing', label: 'Finitions extérieures' }
  ],
  post_construction: [
    { value: 'final_inspection', label: 'Inspection finale' }
  ],
  handover: [
    { value: 'handover_complete', label: 'Livraison complète' }
  ]
};

// Phase labels for display
const PHASE_LABELS: { [key in ConstructionPhase]: string } = {
  pre_construction: 'Pré-construction',
  site_preparation: 'Préparation du site',
  foundation: 'Fondation',
  framing: 'Charpente',
  structural_work: 'Gros œuvre',
  finishing: 'Finitions',
  post_construction: 'Post-construction',
  handover: 'Livraison'
};

const PROCUREMENT_PHASE_LABELS: { [key in ProcurementPhase]: string } = {
  planification: 'Planification',
  publicite: 'Publicité',
  reception_analyse: 'Réception & Analyse',
  attribution: 'Attribution',
  controle_regulation: 'Contrôle & Régulation'
};

interface CustomPhase {
  id: string;
  name: string;
  number: number;
  customStages: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  materials?: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources?: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers?: Array<{ supplierId: string; name?: string; contact?: string }>;
  location?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
}

interface PhaseData {
  id: string;
  phase?: ConstructionPhase;
  stage?: ConstructionStage;
  customPhase?: CustomPhase;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  actualCost: number;
  progress: number;
  materials: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers: Array<{ supplierId: string; name?: string; contact?: string }>;
  location: string;
  notes?: string;
}

interface ConstructionPhaseManagerProps {
  phases: PhaseData[];
  onChange: (phases: PhaseData[]) => void;
  projectBudget?: number;
  projectId?: string;
  referentialType?: ReferentialType;
}

const ConstructionPhaseManager: React.FC<ConstructionPhaseManagerProps> = ({
  phases,
  onChange,
  projectBudget = 0,
  projectId: propProjectId,
  referentialType
}) => {
  const navigate = useNavigate();
  const { id: paramProjectId } = useParams<{ id: string }>();
  const projectId = propProjectId || paramProjectId;
  const { user, loading: authLoading } = useAuth();
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseData | null>(null);
  const [phaseType, setPhaseType] = useState<'standard' | 'custom' | 'procurement'>('standard');
  const [selectedReferential, setSelectedReferential] = useState<ReferentialType | null>(referentialType || null);

  // Authentication check - same as project forms
  const checkAuthenticationAndProceed = (action: () => void, actionName: string) => {
    console.log('=== AUTH CHECK ===');
    console.log('User:', !!user);
    console.log('DEV_MODE:', DEV_MODE);
    console.log('Action:', actionName);
    
    if (!user && !DEV_MODE) {
      console.log('Authentication failed - no user and not DEV_MODE');
      toast({
        title: "Authentification requise",
        description: `Vous devez être connecté pour ${actionName}. Veuillez vous connecter et réessayer.`,
        variant: "destructive",
      });
      return;
    }
    console.log('Authentication passed - executing action');
    action();
  };

  // Create new phase with standard stages
  const createStandardPhase = (selectedPhase: ConstructionPhase, selectedStage: ConstructionStage) => {
    checkAuthenticationAndProceed(() => {
      const phaseLabel = PHASE_LABELS[selectedPhase];
      const stageData = CONSTRUCTION_STAGES[selectedPhase].find(s => s.value === selectedStage);
      
      const newPhase: PhaseData = {
        id: Date.now().toString(),
        phase: selectedPhase,
        stage: selectedStage,
        title: `${phaseLabel} - ${stageData?.label}`,
        description: `Phase ${selectedPhase} - Étape ${stageData?.label}`,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30,
        status: 'not_started',
        budget: Math.floor(projectBudget * 0.1), // Default 10% of project budget
        actualCost: 0,
        progress: 0,
        materials: [],
        humanResources: [],
        suppliers: [],
        location: '',
        notes: ''
      };
      
      onChange([...phases, newPhase]);
      setIsAddingPhase(false);
    }, 'ajouter une phase');
  };

  // Create new procurement phase
  const createProcurementPhase = (selectedPhase: ProcurementPhase, selectedStage: ProcurementStage) => {
    checkAuthenticationAndProceed(() => {
      const phaseLabel = PROCUREMENT_PHASE_LABELS[selectedPhase];
      const stageData = PROCUREMENT_STAGES[selectedPhase].find(s => s.value === selectedStage);

      const newPhase: PhaseData = {
        id: Date.now().toString(),
        title: `${phaseLabel} - ${stageData?.label}`,
        description: `Phase ${phaseLabel} - Étape ${stageData?.label}`,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30,
        status: 'not_started',
        budget: Math.floor(projectBudget * 0.2), // Default 20% of project budget for procurement phases
        actualCost: 0,
        progress: 0,
        materials: [],
        humanResources: [],
        suppliers: [],
        location: '',
        notes: ''
      };

      onChange([...phases, newPhase]);
      setIsAddingPhase(false);
    }, 'ajouter une phase de marché public');
  };

  // Create new custom phase
  const createCustomPhase = (customPhaseData: CustomPhase) => {
    checkAuthenticationAndProceed(() => {
      const newPhase: PhaseData = {
        id: Date.now().toString(),
        customPhase: customPhaseData,
        title: `Phase ${customPhaseData.number}: ${customPhaseData.name}`,
        description: customPhaseData.description || `Phase personnalisée ${customPhaseData.name}`,
        startDate: customPhaseData.startDate || new Date().toISOString().split('T')[0],
        endDate: customPhaseData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30,
        status: customPhaseData.status,
        budget: customPhaseData.budget || Math.floor(projectBudget * 0.1),
        actualCost: 0,
        progress: customPhaseData.progress,
        materials: customPhaseData.materials || [],
        humanResources: customPhaseData.humanResources || [],
        suppliers: customPhaseData.suppliers || [],
        location: customPhaseData.location || '',
        notes: ''
      };
      
      onChange([...phases, newPhase]);
      setIsAddingPhase(false);
    }, 'ajouter une phase personnalisée');
  };

  const updatePhase = (updatedPhase: PhaseData) => {
    checkAuthenticationAndProceed(() => {
      onChange(phases.map(p => p.id === updatedPhase.id ? updatedPhase : p));
      setEditingPhase(null);
    }, 'modifier une phase');
  };

  const deletePhase = (phaseId: string) => {
    checkAuthenticationAndProceed(() => {
      onChange(phases.filter(p => p.id !== phaseId));
    }, 'supprimer une phase');
  };

  const handleViewPhaseDetail = (phaseId: string) => {
    if (!user && !DEV_MODE) {
      toast({
        title: "Authentification requise",
        description: "Vous devez être connecté pour voir les détails d'une phase.",
        variant: "destructive",
      });
      return;
    }
    if (projectId) {
      navigate(`/projects/${projectId}/phases/${phaseId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'delayed': return 'Retardé';
      default: return 'Non commencé';
    }
  };

  // Generate phases from referential template
  const handleGeneratePhasesFromReferential = () => {
    if (!selectedReferential) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un référentiel",
        variant: "destructive",
      });
      return;
    }

    checkAuthenticationAndProceed(() => {
      const referentialPhases = referentialService.getPhasesForReferential(selectedReferential);
      
      const newPhases: PhaseData[] = referentialPhases.map((refPhase, index) => ({
        id: `ref-${Date.now()}-${index}`,
        title: refPhase.label,
        description: refPhase.description || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedDuration: 30,
        status: 'not_started' as const,
        budget: Math.floor(projectBudget / referentialPhases.length),
        actualCost: 0,
        progress: 0,
        materials: [],
        humanResources: [],
        suppliers: [],
        location: '',
        notes: ''
      }));

      onChange(newPhases);
      toast({
        title: "Phases générées",
        description: `${newPhases.length} phases générées depuis le référentiel ${selectedReferential}`,
      });
    }, 'générer les phases');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Gestion des phases de construction
            </CardTitle>
            <Dialog open={isAddingPhase} onOpenChange={setIsAddingPhase}>
              <DialogTrigger asChild>
                <Button disabled={!user && !DEV_MODE}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une phase
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle phase</DialogTitle>
                </DialogHeader>
                
                <Tabs value={phaseType} onValueChange={(value) => setPhaseType(value as 'standard' | 'custom' | 'procurement')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="standard">Phases standards</TabsTrigger>
                    <TabsTrigger value="procurement">Marchés publics</TabsTrigger>
                    <TabsTrigger value="custom">Phase personnalisée</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="standard" className="space-y-4">
                    <StandardPhaseCreator onCreatePhase={createStandardPhase} />
                  </TabsContent>
                  
                  <TabsContent value="procurement" className="space-y-4">
                    <ProcurementPhaseCreator 
                      onCreatePhase={createProcurementPhase}
                      projectBudget={projectBudget}
                    />
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4">
                    <CustomPhaseCreator 
                      onCreatePhase={createCustomPhase}
                      existingPhases={phases}
                      projectBudget={projectBudget}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Referential selector */}
          <div className="flex items-center gap-4">
            <Label>Référentiel du projet:</Label>
            <Select value={selectedReferential || ''} onValueChange={(value) => setSelectedReferential(value as ReferentialType)}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Sélectionner un référentiel" />
              </SelectTrigger>
              <SelectContent>
                {referentialService.getReferentialOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGeneratePhasesFromReferential}
              disabled={!selectedReferential || (!user && !DEV_MODE)}
              variant="outline"
            >
              Générer les phases
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Authentication warning - same as project forms */}
        {!user && !DEV_MODE && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Vous devez être connecté pour gérer les phases de construction. 
              <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.location.href = '/auth'}>
                Se connecter
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {phases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune phase définie. Commencez par ajouter une phase.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <Card key={phase.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{phase.title}</h3>
                      <p className="text-sm text-gray-600">{phase.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(phase.status)}>
                        {getStatusLabel(phase.status)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhaseDetail(phase.id)}
                        className="flex items-center gap-1"
                        disabled={!user && !DEV_MODE}
                      >
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPhase(phase)}
                        disabled={!user && !DEV_MODE}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePhase(phase.id)}
                        disabled={!user && !DEV_MODE}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Dates</p>
                        <p className="text-sm">{phase.startDate} - {phase.endDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-sm">{(phase.budget || 0).toLocaleString()} MRU</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Matériaux</p>
                        <p className="text-sm">{(phase.materials || []).length} éléments</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Ressources</p>
                        <p className="text-sm">{(phase.humanResources || []).length} rôles</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{phase.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Phase editing dialog */}
        {editingPhase && (
          <PhaseEditDialog
            phase={editingPhase}
            onSave={updatePhase}
            onClose={() => setEditingPhase(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Standard Phase Creator Component
const StandardPhaseCreator: React.FC<{
  onCreatePhase: (phase: ConstructionPhase, stage: ConstructionStage) => void;
}> = ({ onCreatePhase }) => {
  const [selectedPhase, setSelectedPhase] = useState<ConstructionPhase | ''>('');
  const [selectedStage, setSelectedStage] = useState<ConstructionStage | ''>('');

  const availableStages = selectedPhase ? CONSTRUCTION_STAGES[selectedPhase] : [];

  const handleCreate = () => {
    if (selectedPhase && selectedStage) {
      onCreatePhase(selectedPhase, selectedStage);
      setSelectedPhase('');
      setSelectedStage('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Phase de construction</Label>
        <Select value={selectedPhase} onValueChange={(value: ConstructionPhase) => {
          setSelectedPhase(value);
          setSelectedStage(''); // Reset stage when phase changes
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une phase" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PHASE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPhase && (
        <div>
          <Label>Étape</Label>
          <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as ConstructionStage)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une étape" />
            </SelectTrigger>
            <SelectContent>
              {availableStages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button 
        onClick={handleCreate} 
        disabled={!selectedPhase || !selectedStage}
        className="w-full"
      >
        Créer la phase
      </Button>
    </div>
  );
};

// Custom Phase Creator Component
const CustomPhaseCreator: React.FC<{
  onCreatePhase: (phase: CustomPhase) => void;
  existingPhases: PhaseData[];
  projectBudget: number;
}> = ({ onCreatePhase, existingPhases, projectBudget }) => {
  const [customPhase, setCustomPhase] = useState<CustomPhase>({
    id: '',
    name: '',
    number: existingPhases.length + 1,
    customStages: [],
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: Math.floor(projectBudget * 0.1),
    materials: [],
    humanResources: [],
    suppliers: [],
    location: '',
    status: 'not_started',
    progress: 0
  });

  const [newStageName, setNewStageName] = useState('');

  const addCustomStage = () => {
    if (newStageName.trim()) {
      const newStage = {
        id: Date.now().toString(),
        name: newStageName.trim(),
        order: customPhase.customStages.length + 1
      };
      setCustomPhase({
        ...customPhase,
        customStages: [...customPhase.customStages, newStage]
      });
      setNewStageName('');
    }
  };

  const removeCustomStage = (stageId: string) => {
    setCustomPhase({
      ...customPhase,
      customStages: customPhase.customStages.filter(s => s.id !== stageId)
    });
  };

  const handleCreate = () => {
    if (customPhase.name.trim()) {
      onCreatePhase({
        ...customPhase,
        id: Date.now().toString()
      });
      // Reset form
      setCustomPhase({
        id: '',
        name: '',
        number: existingPhases.length + 2,
        customStages: [],
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: Math.floor(projectBudget * 0.1),
        materials: [],
        humanResources: [],
        suppliers: [],
        location: '',
        status: 'not_started',
        progress: 0
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nom de la phase</Label>
          <Input
            value={customPhase.name}
            onChange={(e) => setCustomPhase({ ...customPhase, name: e.target.value })}
            placeholder="Ex: Phase spécialisée"
          />
        </div>
        <div>
          <Label>Numéro de phase</Label>
          <Input
            type="number"
            value={customPhase.number}
            onChange={(e) => setCustomPhase({ ...customPhase, number: parseInt(e.target.value) || 1 })}
            min="1"
          />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={customPhase.description}
          onChange={(e) => setCustomPhase({ ...customPhase, description: e.target.value })}
          placeholder="Description de la phase personnalisée"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date de début</Label>
          <Input
            type="date"
            value={customPhase.startDate}
            onChange={(e) => setCustomPhase({ ...customPhase, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={customPhase.endDate}
            onChange={(e) => setCustomPhase({ ...customPhase, endDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Budget estimé (MRU)</Label>
        <Input
          type="number"
          value={customPhase.budget}
          onChange={(e) => setCustomPhase({ ...customPhase, budget: parseInt(e.target.value) || 0 })}
          min="0"
        />
      </div>

      {/* Custom Stages */}
      <div>
        <Label>Étapes personnalisées</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Nom de l'étape"
            onKeyPress={(e) => e.key === 'Enter' && addCustomStage()}
          />
          <Button type="button" onClick={addCustomStage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {customPhase.customStages.length > 0 && (
          <div className="space-y-2">
            {customPhase.customStages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{stage.order}. {stage.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomStage(stage.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button 
        onClick={handleCreate} 
        disabled={!customPhase.name.trim()}
        className="w-full"
      >
        Créer la phase personnalisée
      </Button>
    </div>
  );
};

// Phase Edit Dialog Component (simplified for space)
const PhaseEditDialog: React.FC<{
  phase: PhaseData;
  onSave: (phase: PhaseData) => void;
  onClose: () => void;
}> = ({ phase, onSave, onClose }) => {
  const [editedPhase, setEditedPhase] = useState<PhaseData>(phase);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier la phase: {phase.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input
              value={editedPhase.title}
              onChange={(e) => setEditedPhase({ ...editedPhase, title: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea
              value={editedPhase.description}
              onChange={(e) => setEditedPhase({ ...editedPhase, description: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={editedPhase.startDate}
                onChange={(e) => setEditedPhase({ ...editedPhase, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={editedPhase.endDate}
                onChange={(e) => setEditedPhase({ ...editedPhase, endDate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label>Budget (MRU)</Label>
            <Input
              type="number"
              value={editedPhase.budget}
              onChange={(e) => setEditedPhase({ ...editedPhase, budget: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div>
            <Label>Statut</Label>
            <Select 
              value={editedPhase.status} 
              onValueChange={(value: any) => setEditedPhase({ ...editedPhase, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Non commencé</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="delayed">Retardé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Progression (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={editedPhase.progress}
              onChange={(e) => setEditedPhase({ ...editedPhase, progress: parseInt(e.target.value) || 0 })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={() => onSave(editedPhase)}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Procurement Phase Creator Component
const ProcurementPhaseCreator: React.FC<{
  onCreatePhase: (phase: ProcurementPhase, stage: ProcurementStage) => void;
  projectBudget: number;
}> = ({ onCreatePhase, projectBudget }) => {
  const [selectedPhase, setSelectedPhase] = useState<ProcurementPhase | ''>('');
  const [selectedStage, setSelectedStage] = useState<ProcurementStage | ''>('');

  const availableStages = selectedPhase ? PROCUREMENT_STAGES[selectedPhase] : [];

  const handleCreate = () => {
    if (selectedPhase && selectedStage) {
      onCreatePhase(selectedPhase, selectedStage);
      setSelectedPhase('');
      setSelectedStage('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border">
        <h4 className="font-medium text-blue-800 mb-2">
          Workflow des Marchés Publics en Mauritanie
        </h4>
        <p className="text-sm text-blue-700">
          Procédure officielle des marchés publics utilisée par les entreprises publiques mauritaniennes.
        </p>
      </div>

      <div>
        <Label>Phase du marché public</Label>
        <Select value={selectedPhase} onValueChange={(value: ProcurementPhase) => {
          setSelectedPhase(value);
          setSelectedStage('');
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une phase" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROCUREMENT_PHASE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPhase && (
        <div>
          <Label>Étape</Label>
          <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as ProcurementStage)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une étape" />
            </SelectTrigger>
            <SelectContent>
              {availableStages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button 
        onClick={handleCreate} 
        disabled={!selectedPhase || !selectedStage}
        className="w-full"
      >
        Créer la phase de marché public
      </Button>
    </div>
  );
};

export default ConstructionPhaseManager;
