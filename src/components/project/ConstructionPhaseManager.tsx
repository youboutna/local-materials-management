import React, { useState, useEffect, useMemo } from 'react';

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

import { Checkbox } from '@/components/ui/checkbox';

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

  AlertCircle,

  Flag,

  Zap,

  ClipboardCheck,

  Clock

} from 'lucide-react';

import { CustomPhase, PhaseData } from '@/dtos/entities/PhaseDTO';

import { GeneratedMilestoneDTO } from '@/dtos/entities/MilestoneDTO';

// Types for procurement phases from referential
type ProcurementPhase = string;
type ProcurementStage = string;

import { useAuth } from '@/contexts/use-auth';

import { toast } from '@/hooks/use-toast';

import { DEV_MODE } from '@/config/constants';

import { ReferentialType } from '@/config/referentials';

import { useConstructionPhaseHex } from '@/hooks/hexagonal/useConstructionPhaseHex';

import { PhaseService } from '@/application/services/PhaseService';

import { MilestoneService } from '@/application/services/MilestoneService';

import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

import { referentialService } from '@/application/services/ReferentialService';
import { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';

// PhaseService instance for dynamic data
const phaseService = new PhaseService();

//les types, interfaces sont à recuperer depuis les referentiels et domain, dtos, transformers.


interface ConstructionPhaseManagerProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { phases: PhaseDTO[] }) => void;
  phases: PhaseDTO[];
  projectBudget?: number;
  projectId: string | undefined;
  referentialType?: ReferentialType;
}



const ConstructionPhaseManager: React.FC<ConstructionPhaseManagerProps> = ({
  workflowData,
  onStepComplete,
  projectBudget,
  projectId,
  referentialType,
}) => {
  const existingPhases = workflowData?.relatedData?.phases || [];
  const navigate = useNavigate();

  const { id: paramProjectId } = useParams<{ id: string }>();

  const { user, loading: authLoading } = useAuth();

  

  // Use hexagonal hook for construction phase management

  const constructionPhaseHook = useConstructionPhaseHex(paramProjectId);



  // Merge with existing phases

  const allPhases = [...constructionPhaseHook.phases, ...existingPhases];

  

  const [isAddingPhase, setIsAddingPhase] = useState(false);

  const [isGeneratingFromReferential, setIsGeneratingFromReferential] = useState(false);

  const [selectedReferential, setSelectedReferential] = useState<ReferentialType | null>(null);

  const effectiveProjectId = projectId || paramProjectId;

  const [editingPhase, setEditingPhase] = useState<PhaseData | null>(null);

  const [phaseType, setPhaseType] = useState<'standard' | 'custom' | 'procurement'>('standard');

  const [generateMilestones, setGenerateMilestones] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);

  

  const phaseService = useMemo(() => new PhaseService(RepositoryFactory.getPhaseRepository()), []);

  const milestoneService = useMemo(() => new MilestoneService(RepositoryFactory.getMilestoneRepository()), []);



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

  const createStandardPhase = async (selectedPhase: string, selectedStage: string) => {

    checkAuthenticationAndProceed(async () => {

      // Get phase data from service
      const referentialPhases = await referentialService.getPhasesForReferential('SOMELEC_INFRA');
      const phaseData = referentialPhases.find(p => p.code === selectedPhase);
      const phaseLabel = phaseData?.label || selectedPhase;

      // Get stage data from referential dynamically
      const stageData = phaseData?.steps.find(s => s.code === selectedStage);

      

      const newPhase: PhaseData = {

        id: Date.now().toString(),

        phase: selectedPhase,

        stage: selectedStage,

        title: `${phaseLabel} - ${stageData?.label}`,

        description: `Phase ${selectedPhase} - Étape ${stageData?.label}`,

        startDate: new Date().toISOString().split('T')[0],

        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

        estimatedDuration: 30,

        status: 'not_started' as const,

        budget: Math.floor((projectBudget || 0) * 0.1), // Default 10% of project budget

        actualCost: 0,

        progress: 0,

        materials: [],

        humanResources: [],

        suppliers: [],

        location: '',

        notes: ''

      };

      

      // Create the phase using the hexagonal hook
      await constructionPhaseHook.createConstructionPhase(newPhase as unknown as PhaseDTO);

      setIsAddingPhase(false);

    }, 'ajouter une phase');

  };



  // Create new procurement phase

  const createProcurementPhase = async (selectedPhase: string, selectedStage: string) => {

    checkAuthenticationAndProceed(async () => {

      // Get phase label from referential dynamically
      const referentialPhases = await referentialService.getPhasesForReferential('MR_PUBLIC_PROCUREMENT');
      const phaseData = referentialPhases.find(p => p.code === selectedPhase);
      const phaseLabel = phaseData?.label || selectedPhase;

      // Get stage data from referential dynamically
      const stageData = phaseData?.steps.find(s => s.code === selectedStage);



      const newPhase: PhaseData = {

        id: Date.now().toString(),

        title: `${phaseLabel} - ${stageData?.label}`,

        description: `Phase ${phaseLabel} - Étape ${stageData?.label}`,

        startDate: new Date().toISOString().split('T')[0],

        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

        estimatedDuration: 30,

        status: 'not_started' as const,

        budget: Math.floor((projectBudget || 0) * 0.2), // Default 20% of project budget for procurement phases

        actualCost: 0,

        progress: 0,

        materials: [],

        humanResources: [],

        suppliers: [],

        location: '',

        notes: ''

      };

      // Create the phase using the hexagonal hook
      await constructionPhaseHook.createConstructionPhase(newPhase as unknown as PhaseDTO);

      setIsAddingPhase(false);

    }, 'ajouter une phase de marché public');

  };



  // Create new custom phase

  const createCustomPhase = async (customPhaseData: CustomPhase) => {

    checkAuthenticationAndProceed(async () => {

      const newPhase: PhaseData = {

        id: Date.now().toString(),

        customPhase: customPhaseData,

        title: `Phase ${customPhaseData.number}: ${customPhaseData.name}`,

        description: customPhaseData.description || `Phase personnalisée ${customPhaseData.name}`,

        startDate: customPhaseData.startDate || new Date().toISOString().split('T')[0],

        endDate: customPhaseData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

        estimatedDuration: 30,

        status: (customPhaseData.status === 'planned' ? 'not_started' : 
                customPhaseData.status === 'active' ? 'in_progress' : 
                customPhaseData.status === 'paused' ? 'delayed' : 
                customPhaseData.status) as 'not_started' | 'in_progress' | 'completed' | 'delayed',

        budget: customPhaseData.budget || Math.floor((projectBudget || 0) * 0.1),

        actualCost: 0,

        progress: customPhaseData.progress,

        materials: customPhaseData.materials || [],

        humanResources: customPhaseData.humanResources || [],

        suppliers: customPhaseData.suppliers || [],

        location: customPhaseData.location || '',

        notes: ''

      };

      // Create the phase using the hexagonal hook
      await constructionPhaseHook.createConstructionPhase(newPhase as unknown as PhaseDTO);

      setIsAddingPhase(false);

    }, 'ajouter une phase personnalisée');

  };



  const updatePhase = async (updatedPhase: PhaseData) => {

    checkAuthenticationAndProceed(async () => {

      await constructionPhaseHook.updateConstructionPhase(updatedPhase.id, updatedPhase as unknown as PhaseDTO);

      setEditingPhase(null);

    }, 'modifier une phase');

  };



  const deletePhase = async (phaseId: string) => {

    checkAuthenticationAndProceed(async () => {

      await constructionPhaseHook.deleteConstructionPhase(phaseId);

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

    if (effectiveProjectId) {

      navigate(`/projects/${effectiveProjectId}/phases/${phaseId}`);

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



  // Generate phases, steps, tasks and milestones from referential template

  const handleGeneratePhasesFromReferential = async () => {

    if (!selectedReferential) {

      toast({

        title: "Erreur",

        description: "Veuillez sélectionner un référentiel",

        variant: "destructive",

      });

      return;

    }



    checkAuthenticationAndProceed(async () => {

      setIsGenerating(true);

      

      try {

        // Get summary first

        const summary = await referentialService.getPhasesForReferential(selectedReferential!);

        

        if (summary.length === 0) {

          toast({

            title: "Aucune phase",

            description: "Ce référentiel ne contient pas de phases configurées",

            variant: "destructive",

          });

          setIsGenerating(false);

          return;

        }



        const referentialPhases = summary;

        

        // Generate phases with their steps, tasks and milestones

        const newPhases: PhaseData[] = [];

        let phaseIndex = 0;

        let cumulativeStartDays = 0;

        let totalMilestones = 0;

        

        for (const refPhase of referentialPhases) {

          // Check if this phase already exists

          const phaseExists = allPhases.some(p => (p as PhaseData).title === refPhase.label || (p as PhaseDTO).name === refPhase.label);

          if (phaseExists) continue;

          

          // Calculate total duration for this phase based on steps/tasks

          let phaseDuration = 0;

          const stepsInfo: string[] = [];

          

          for (const step of refPhase.steps || []) {

            let stepDuration = 0;

            const taskLabels: string[] = [];

            

            for (const task of step.tasks || []) {

              stepDuration += task.estimatedDurationDays || 7;

              taskLabels.push(`• ${task.label}`);

            }

            

            if (stepDuration === 0) stepDuration = 14;

            phaseDuration += stepDuration;

            

            stepsInfo.push(`**${step.label}**\n${taskLabels.join('\n')}`);

          }

          

          if (phaseDuration === 0) phaseDuration = 30;

          

          // Calculate dates based on cumulative duration

          const startDate = new Date();

          startDate.setDate(startDate.getDate() + cumulativeStartDays);

          const endDate = new Date(startDate);

          endDate.setDate(endDate.getDate() + phaseDuration);

          

          const phaseId = `ref-${Date.now()}-${phaseIndex}`;

          

          // Generate milestones for this phase if enabled

          const phaseMilestones: any[] = [];

          if (generateMilestones) {

            totalMilestones += phaseMilestones.length;

          }

          

          // Build description with steps and milestones info

          let description = refPhase.description 

            ? `${refPhase.description}\n\n${stepsInfo.length > 0 ? 'Étapes:\n' + stepsInfo.join('\n\n') : ''}`

            : stepsInfo.length > 0 ? 'Étapes:\n' + stepsInfo.join('\n\n') : '';

          

          if (phaseMilestones.length > 0) {

            const milestoneInfo = phaseMilestones

              .filter(m => m.priority === 'critical' || m.type === 'gate')

              .map(m => `🎯 ${m.title} (${m.target_date})`)

              .join('\n');

            if (milestoneInfo) {

              description += `\n\nJalons clés:\n${milestoneInfo}`;

            }

          }

          

          // Create custom phase with stages from referential steps

          const customStages = (refPhase.steps || []).map((step, stepIdx) => ({

            id: `step-${Date.now()}-${phaseIndex}-${stepIdx}`,

            name: step.label,

            order: step.order || stepIdx + 1,

            tasks: (step.tasks || []).map((task, taskIdx) => ({

              id: `task-${Date.now()}-${phaseIndex}-${stepIdx}-${taskIdx}`,

              name: task.label,

              description: task.description || '',

              estimatedDurationDays: task.estimatedDurationDays || 7,

              requiresInspection: task.requiresInspection || false,

              requiresEngineerApproval: task.requiresEngineerApproval || false,

              status: 'not_started'

            }))

          }));



          const newPhase: PhaseData = {

            id: phaseId,

            title: refPhase.label,

            description: description.trim(),

            startDate: startDate.toISOString().split('T')[0],

            endDate: endDate.toISOString().split('T')[0],

            estimatedDuration: phaseDuration,

            status: 'not_started' as const,

            budget: Math.floor((projectBudget || 0) / referentialPhases.length),

            actualCost: 0,

            progress: 0,

            materials: [],

            humanResources: [],

            suppliers: [],

            location: '',

            notes: `Référentiel: ${selectedReferential}\nCode phase: ${refPhase.code}${generateMilestones ? `\nJalons: ${phaseMilestones.length}` : ''}`,

            customPhase: {

              id: `custom-${Date.now()}-${phaseIndex}`,

              name: refPhase.label,

              number: refPhase.order || phaseIndex + 1,

              customStages: customStages,

              description: refPhase.description || '',

              startDate: startDate.toISOString().split('T')[0],

              endDate: endDate.toISOString().split('T')[0],

              budget: Math.floor((projectBudget || 0) / referentialPhases.length),

              status: 'planned',

              progress: 0

            }

          };

          

          newPhases.push(newPhase);

          cumulativeStartDays += phaseDuration;

          phaseIndex++;

        }



        if (newPhases.length === 0) {

          toast({

            title: "Aucune nouvelle phase",

            description: "Toutes les phases du référentiel sont déjà présentes",

          });

          setIsGenerating(false);

          return;

        }



        // Add new phases to existing phases (map PhaseData → PhaseDTO shape: title → name)
        for (const newPhase of newPhases) {
          const phaseDTO = {
            ...(newPhase as any),
            name: (newPhase as any).title || (newPhase as any).name || '',
          } as unknown as PhaseDTO;
          await constructionPhaseHook.createConstructionPhase(phaseDTO);
        }

        

        // Count total steps and tasks

        const totalSteps = newPhases.reduce((sum, p) => sum + (p.customPhase?.customStages?.length || 0), 0);

        const totalTasks = newPhases.reduce((sum, p) => 

          sum + (p.customPhase?.customStages?.reduce((s, stage) => s + ((stage as any).tasks?.length || 0), 0) || 0), 0);

        

        toast({

          title: "Structure générée",

          description: `${newPhases.length} phase(s), ${totalSteps} étape(s), ${totalTasks} tâche(s)${generateMilestones ? ` et ${totalMilestones} jalon(s)` : ''} ajoutés depuis le référentiel ${selectedReferential}`,

        });

      } catch (error) {

        console.error('Error generating phases:', error);

        toast({

          title: "Erreur",

          description: "Une erreur est survenue lors de la génération",

          variant: "destructive",

        });

      } finally {

        setIsGenerating(false);

      }

    }, 'générer les phases');

  };



  const [generationPreview, setGenerationPreview] = useState<any>(null);

  const [referentialOptions, setReferentialOptions] = useState<any[]>([]);

  const [generationSummary, setGenerationSummary] = useState<any>(null);



  // Load referential options when component mounts

  useEffect(() => {

    const loadReferentialOptions = async () => {

      try {

        const options = await referentialService.getReferentialOptions();

        setReferentialOptions(options);

      } catch (error) {

        console.error('Error loading referential options:', error);

        setReferentialOptions([]);

      }

    };



    loadReferentialOptions();

  }, [referentialService]);



  // Load generation preview and referential options when referential changes

  useEffect(() => {

    const loadPreview = async () => {

      if (!selectedReferential) {

        setGenerationPreview(null);

        setGenerationSummary(null);

        return;

      }

      try {

        const [preview, options, phases] = await Promise.all([

          referentialService.getPhasesForReferential(selectedReferential),

          referentialService.getReferentialOptions(),

          phaseService.createConstructionPhasesFromReferential('temp-project', selectedReferential)

        ]);

        // Create summary from phases

        const summary = {

          totalPhases: phases.length,

          estimatedDuration: phases.reduce((sum, phase) => sum + (phase.estimatedDuration || 0), 0),

          totalCost: phases.reduce((sum, phase) => sum + (phase.estimatedCost || 0), 0),

          phases: phases.map(p => ({

            name: p.phaseName,

            duration: p.estimatedDuration,

            cost: p.estimatedCost

          }))

        };

        setGenerationPreview(preview);

        setReferentialOptions(options);

        setGenerationSummary(summary);

      } catch (error) {

        console.error('Error loading generation preview:', error);

        setGenerationPreview(null);

        setGenerationSummary(null);

      }

    };



    loadPreview();

  }, [selectedReferential, phaseService, referentialService]);



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

                      projectBudget={projectBudget || 0}

                    />

                  </TabsContent>

                  

                  <TabsContent value="custom" className="space-y-4">

                    <CustomPhaseCreator 

                      onCreatePhase={createCustomPhase}

                      existingPhases={allPhases.filter((phase): phase is PhaseData => 'title' in phase)}

                      projectBudget={projectBudget || 0}

                    />

                  </TabsContent>

                </Tabs>

              </DialogContent>

            </Dialog>

          </div>

          

          {/* Referential selector with milestone generation option */}

          <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg border">

            <div className="flex items-center gap-4 flex-wrap">

              <div className="flex items-center gap-2">

                <Label className="whitespace-nowrap">Référentiel:</Label>

                <Select value={selectedReferential || ''} onValueChange={(value) => setSelectedReferential(value as ReferentialType)}>

                  <SelectTrigger className="w-[280px]">

                    <SelectValue placeholder="Sélectionner un référentiel" />

                  </SelectTrigger>

                  <SelectContent>

                    {referentialOptions.map(option => (

                      <SelectItem key={option.value} value={option.value}>

                        {option.label}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              

              <div className="flex items-center gap-2">

                <Checkbox 

                  id="generateMilestones" 

                  checked={generateMilestones}

                  onCheckedChange={(checked) => setGenerateMilestones(checked as boolean)}

                />

                <Label htmlFor="generateMilestones" className="flex items-center gap-1 cursor-pointer">

                  <Flag className="h-4 w-4 text-primary" />

                  Générer jalons

                </Label>

              </div>

              

              <Button 

                onClick={handleGeneratePhasesFromReferential}

                disabled={!selectedReferential || (!user && !DEV_MODE) || isGenerating}

                variant="default"

                className="gap-2"

              >

                <Zap className="h-4 w-4" />

                {isGenerating ? 'Génération...' : 'Générer structure'}

              </Button>

            </div>

            

            {/* Generation preview */}

            {generationSummary && selectedReferential && (

              <div className="flex items-center gap-4 text-sm text-muted-foreground">

                <span className="flex items-center gap-1">

                  <Building className="h-4 w-4" />

                  {generationSummary.totalPhases} phases

                </span>

                <span className="flex items-center gap-1">

                  <ClipboardCheck className="h-4 w-4" />

                  {generationSummary.totalSteps} étapes

                </span>

                <span className="flex items-center gap-1">

                  <Package className="h-4 w-4" />

                  {generationSummary.totalTasks} tâches

                </span>

                {generateMilestones && (

                  <span className="flex items-center gap-1 text-primary font-medium">

                    <Flag className="h-4 w-4" />

                    {generationSummary.totalMilestones} jalons

                  </span>

                )}

                <span className="flex items-center gap-1">

                  <Clock className="h-4 w-4" />

                  {generationSummary.estimatedDurationDays} jours

                </span>

              </div>

            )}

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

        

        {allPhases.length === 0 ? (

          <div className="text-center py-8 text-gray-500">

            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />

            <p>Aucune phase définie. Commencez par ajouter une phase.</p>

          </div>

        ) : (

          <div className="space-y-4">

            {allPhases.map((phase, index) => (

              <Card key={phase.id} className="border-l-4 border-l-blue-500">

                <CardHeader className="pb-3">

                  <div className="flex items-center justify-between">

                    <div>

                      <h3 className="font-medium">{(phase as PhaseData).title || (phase as PhaseDTO).name}</h3>

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

                        onClick={() => setEditingPhase((phase as PhaseData))}

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

                        <p className="text-sm">{((phase as PhaseData).materials || []).length} éléments</p>

                      </div>

                    </div>

                    

                    <div className="flex items-center gap-2">

                      <Users className="h-4 w-4 text-gray-500" />

                      <div>

                        <p className="text-xs text-gray-500">Ressources</p>

                        <p className="text-sm">{((phase as PhaseData).humanResources || []).length} rôles</p>

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

                        className="bg-primary h-2 rounded-full transition-all duration-300"

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
  onCreatePhase: (phase: string, stage: string) => void;
}> = ({ onCreatePhase }) => {

  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [availablePhases, setAvailablePhases] = useState<Array<{value: string; label: string}>>([]);
  const [availableStages, setAvailableStages] = useState<Array<{value: string; label: string}>>([]);

  // Fetch phases from database via service
  useEffect(() => {
    const fetchPhases = async () => {
      setLoading(true);
      try {
        const phases = await referentialService.getPhasesForReferential('SOMELEC_INFRA');
        const phaseOptions = phases.map(phase => ({
          value: phase.code,
          label: phase.label
        }));
        setAvailablePhases(phaseOptions);
      } catch (error) {
        console.error('Failed to fetch phases:', error);
        setAvailablePhases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhases();
  }, []);

  // Fetch stages when phase changes
  useEffect(() => {
    const fetchStages = async () => {
      if (!selectedPhase) {
        setAvailableStages([]);
        return;
      }

      setLoading(true);
      try {
        const phases = await referentialService.getPhasesForReferential('SOMELEC_INFRA');
        const selectedPhaseData = phases.find(p => p.code === selectedPhase);
        
        if (selectedPhaseData) {
          const stageOptions = selectedPhaseData.steps.map(step => ({
            value: step.code,
            label: step.label
          }));
          setAvailableStages(stageOptions);
        } else {
          setAvailableStages([]);
        }
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        setAvailableStages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, [selectedPhase]);

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

        <Select value={selectedPhase} onValueChange={(value: string) => {

          setSelectedPhase(value);

          setSelectedStage(''); // Reset stage when phase changes

        }}>

          <SelectTrigger>

            <SelectValue placeholder="Sélectionner une phase" />

          </SelectTrigger>

          <SelectContent>

            {availablePhases.map((phase) => (

              <SelectItem key={phase.value} value={phase.value}>

                {phase.label}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

      </div>



      {selectedPhase && (

        <div>

          <Label>Étape</Label>

          <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value)}>

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

    budget: Math.floor((projectBudget || 0) * 0.1),

    materials: [],

    humanResources: [],

    suppliers: [],

    location: '',

    status: 'planned',

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

        budget: Math.floor((projectBudget || 0) * 0.1),

        materials: [],

        humanResources: [],

        suppliers: [],

        location: '',

        status: 'planned',

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



  const availableStages = selectedPhase ? 
    referentialService.getPhasesForReferential('MR_PUBLIC_PROCUREMENT' as any)
      .then(phases => phases.find(p => p.code === selectedPhase)?.steps.map(s => ({
        value: s.code,
        label: s.label
      })) || []) : Promise.resolve([]);

  // Use state for async referential data
  const [procurementPhases, setProcurementPhases] = React.useState<Array<{value: string, label: string}>>([]);
  const [procurementStages, setProcurementStages] = React.useState<Array<{value: string, label: string}>>([]);

  React.useEffect(() => {
    referentialService.getPhasesForReferential('MR_PUBLIC_PROCUREMENT' as any).then(phases => {
      setProcurementPhases(phases.map(phase => ({
        value: phase.code,
        label: phase.label
      })));
    });
  }, []);

  React.useEffect(() => {
    if (selectedPhase) {
      referentialService.getPhasesForReferential('MR_PUBLIC_PROCUREMENT' as any).then(phases => {
        const phaseData = phases.find(p => p.code === selectedPhase);
        setProcurementStages(phaseData?.steps.map(s => ({
          value: s.code,
          label: s.label
        })) || []);
      });
    }
  }, [selectedPhase]);

  const availableProcurementPhases = procurementPhases;

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

            {availableProcurementPhases.map((phase) => (

              <SelectItem key={phase.value} value={phase.value}>

                {phase.label}

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

              {procurementStages.map((stage) => (

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

export type { PhaseData, CustomPhase };

