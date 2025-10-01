import { ExternalLink, Layers, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import EnhancedWorkflowPhaseManager from '../EnhancedWorkflowPhaseManager';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '../../ui/badge';
import { useNavigate } from 'react-router-dom';

interface PhasePlanificationStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  isEditing?: boolean;
  baseData?: any;
}

interface Phase {
  id: string;
  phase_name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
}

const PhasePlanificationStep: React.FC<PhasePlanificationStepProps> = ({
  formData,
  onUpdate,
  selectedMaterials,
  onMaterialsChange,
  isEditing = false,
  baseData = {}
}) => {
  const navigate = useNavigate();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formData.id) {
      loadPhases();
    }
  }, [formData.id]);

  const loadPhases = async () => {
    if (!formData.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', formData.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPhases(data || []);
    } catch (error) {
      console.error('Error loading phases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseClick = (phaseId: string) => {
    navigate(`/projects/${formData.id}/phases/detail?phase=${phaseId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          Phases & Planification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium">Gestion des phases du projet</h4>
            {formData.id && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/projects/${formData.id}/phases/detail`)}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Vue détaillée des phases
              </Button>
            )}
          </div>
          
          {/* Phase Creation/Management */}
          <div className="border rounded-lg p-4">
            <EnhancedWorkflowPhaseManager
              projectId={formData.id || 'new-project'}
            />
          </div>

          {/* Existing Phases List */}
          {formData.id && phases.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-medium">Phases existantes - Cliquez pour gérer</h4>
              <div className="grid gap-3">
                {phases.map((phase) => (
                  <Card 
                    key={phase.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePhaseClick(phase.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h5 className="font-semibold">{phase.phase_name}</h5>
                            <Badge className={getStatusColor(phase.status)}>
                              {phase.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description || 'Pas de description'}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Début: {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'N/A'}</span>
                            <span>Fin: {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'N/A'}</span>
                            <span>Progrès: {phase.progress ?? 0}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {formData.id && phases.length === 0 && !loading && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Aucune phase créée.</strong> Créez des phases ci-dessus pour commencer à planifier votre projet.
                Une fois créées, vous pourrez gérer les ressources, matériaux et documents de chaque phase.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhasePlanificationStep;