import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/use-auth';
import { DEV_MODE } from '@/config/constants';
import { PhaseService } from '@/application/services/PhaseService';
import ConstructionPhaseManager, { PhaseData } from './ConstructionPhaseManager';

interface ProjectPhasesProps {
  projectId?: string;
  onUpdate?: () => void;
  projectBudget?: number;
  formMode?: boolean; // When true, don't save to database, just manage state
  initialPhases?: PhaseData[];
  onPhasesChange?: (phases: PhaseData[]) => void;
}

const ProjectPhases: React.FC<ProjectPhasesProps> = ({ 
  projectId, 
  onUpdate, 
  projectBudget = 0,
  formMode = false,
  initialPhases = [],
  onPhasesChange
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [phases, setPhases] = useState<PhaseData[]>(initialPhases);
  const [loading, setLoading] = useState(!formMode);

  // Load phases from database
  const fetchProjectPhases = async () => {
    console.log('=== FETCH PROJECT PHASES ===');
    console.log('ProjectId:', projectId);
    console.log('FormMode:', formMode);
    
    if (!projectId || formMode) {
      console.log('Skipping fetch - no projectId or formMode is true');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Starting to fetch phases...');
      setLoading(true);
      const loadedPhases = await new PhaseService(null as any).getPhasesByProject(projectId);
      console.log('Loaded phases from database:', loadedPhases);
      // Map PhaseDTO to PhaseData with required fields
      const mappedPhases: PhaseData[] = loadedPhases.map((phase: any) => ({
        id: phase.id,
        phase: phase.type || phase.constructionPhase || '',
        title: phase.name || phase.title || 'Phase',
        description: phase.description || '',
        startDate: phase.startDate || new Date().toISOString(),
        endDate: phase.endDate || new Date().toISOString(),
        estimatedDuration: phase.estimatedDuration || 0,
        status: phase.status || 'not_started',
        budget: phase.budget || 0,
        actualCost: phase.actualCost || 0,
        progress: phase.progress || 0,
        materials: [],
        humanResources: [],
        suppliers: [],
        location: '',
      }));
      setPhases(mappedPhases);
    } catch (error) {
      console.error('Error fetching project phases:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les phases du projet.",
        variant: "destructive",
      });
    } finally {
      console.log('Fetch complete - setting loading false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered - ProjectPhases', { projectId, formMode, hasInitialPhases: initialPhases.length });
    
    if (formMode) {
      setPhases(initialPhases);
      setLoading(false);
      return;
    }
    fetchProjectPhases();
  }, [projectId, formMode]); // Removed initialPhases from dependencies to prevent infinite loop

  // Separate effect to handle initialPhases changes in form mode
  useEffect(() => {
    if (formMode && initialPhases.length > 0) {
      console.log('Updating phases from initialPhases in form mode');
      setPhases(initialPhases);
    }
  }, [formMode]); // Only trigger when formMode changes, not initialPhases

  // Handle phase changes and save to database
  const handlePhasesChange = async (newPhases: PhaseData[]) => {
    console.log('=== PHASE CHANGE HANDLER ===');
    console.log('Handling phases change:', { 
      formMode, 
      projectId, 
      phasesCount: newPhases.length,
      newPhases: newPhases.map(p => ({ id: p.id, title: p.title }))
    });
    setPhases(newPhases);
    
    // In form mode, just update state and notify parent
    if (formMode) {
      console.log('Form mode: updating parent with phases');
      onPhasesChange?.(newPhases);
      return;
    }
    
    // In database mode, save to database
    if (!projectId) {
      console.error('No projectId provided for saving phases');
      toast({
        title: "Erreur",
        description: "ID du projet manquant pour sauvegarder les phases",
        variant: "destructive",
      });
      return;
    }
    
    try {
       console.log('=== ATTEMPTING TO SAVE PHASES ===');
       console.log('ProjectId:', projectId);
       console.log('Phases to save:', newPhases.length);
       
       // PhaseService.saveProjectPhases does not exist, so we update phases individually
       const phaseService = new PhaseService(null as any);
       for (const phase of newPhases) {
         if (phase.id) {
           // Update existing phase
           await phaseService.updatePhase(phase.id, {
             name: phase.title || '',
             description: phase.description || '',
             type: phase.phase || 'construction',
             status: phase.status || 'not_started',
             startDate: phase.startDate,
             endDate: phase.endDate,
           } as any);
         }
       }
       
       toast({
         title: "Phases sauvegardées",
         description: `${newPhases.length} phase(s) mise(s) à jour avec succès.`,
       });
       
       onUpdate?.();
     } catch (error) {
       console.error('Error saving phases:', error);
       toast({
         title: "Erreur",
         description: `Erreur lors de la sauvegarde des phases: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
         variant: "destructive",
       });
       
       // Only reload phases from database on error if not in form mode
       if (!formMode) {
         await fetchProjectPhases();
       }
     }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication warning - same as project forms */}
      {!formMode && !user && !DEV_MODE && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour gérer les phases du projet. 
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => window.location.href = '/auth'}>
              Se connecter
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <ConstructionPhaseManager
        workflowData={{ phases } as any}
        onStepComplete={(stepData: any) => handlePhasesChange(stepData?.phases || [])}
        projectBudget={projectBudget}
        phases={phases as any}
        projectId={projectId}
      />
    </div>
  );
};

export default ProjectPhases;