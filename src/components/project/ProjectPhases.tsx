import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { DEV_MODE } from '@/config/constants';
import { PhaseService, PhaseData } from '@/services/phaseService';
import ConstructionPhaseManager from './ConstructionPhaseManager';

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
    if (!projectId || formMode) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const loadedPhases = await PhaseService.loadProjectPhases(projectId);
      setPhases(loadedPhases);
    } catch (error) {
      console.error('Error fetching project phases:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les phases du projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formMode) {
      setPhases(initialPhases);
      setLoading(false);
      return;
    }
    fetchProjectPhases();
  }, [projectId, formMode, initialPhases]);

  // Handle phase changes and save to database
  const handlePhasesChange = async (newPhases: PhaseData[]) => {
    console.log('Handling phases change:', { formMode, projectId, phasesCount: newPhases.length });
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
      console.log('Saving phases to database...');
      await PhaseService.saveProjectPhases(projectId, newPhases);
      
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
        phases={phases}
        onChange={handlePhasesChange}
        projectBudget={projectBudget}
      />
    </div>
  );
};

export default ProjectPhases;