
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Calendar, MapPin, DollarSign, Clock } from 'lucide-react';

const ProjectImporter2025 = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importProgress, setImportProgress] = useState(0);

  const projects2025 = [
    {
      project_order: 1,
      title: "Acquisition d'un progiciel de parallèlement GPS différentiel",
      description: "Acquisition d'un système GPS différentiel pour améliorer la précision des mesures topographiques",
      location: "Nouakchott",
      status: "en cours",
      progress: 0,
      budget: 15000000,
      start_date: "2025-04-14",
      end_date: "2025-10-14",
      team_size: 3,
      financing_source: "ETR-ML",
      market_type: "Fournitures",
      selection_mode: "Consultation Simplifiée",
      launch_date: "2025-04-14T02:00:00Z",
      attribution_date: "2025-04-14T02:00:00Z",
      completion_date: "2025-10-14T02:00:00Z"
    },
    {
      project_order: 2,
      title: "Construction du siège de ETR-ML en matériaux locaux",
      description: "Construction d'un bâtiment moderne utilisant des matériaux locaux pour le siège de ETR-ML",
      location: "Nouakchott",
      status: "en cours",
      progress: 25,
      budget: 85000000,
      start_date: "2025-06-24",
      end_date: "2025-10-27",
      team_size: 15,
      financing_source: "ETR-ML",
      market_type: "Travaux",
      selection_mode: "Appel Offre Durant National",
      launch_date: "2025-04-14T02:00:00Z",
      attribution_date: "2025-04-14T02:00:00Z",
      completion_date: "2025-10-27T01:00:00Z"
    },
    {
      project_order: 3,
      title: "Acquisition du matériel de transport",
      description: "Acquisition de véhicules et équipements de transport pour les opérations de terrain",
      location: "Nouakchott",
      status: "en cours",
      progress: 15,
      budget: 45000000,
      start_date: "2025-06-26",
      end_date: "2025-10-14",
      team_size: 5,
      financing_source: "ETR-ML",
      market_type: "Fournitures",
      selection_mode: "Appel d'Offre National Restreint",
      launch_date: "2025-04-14T02:00:00Z",
      attribution_date: "2025-06-16T02:00:00Z",
      completion_date: "2025-10-14T02:00:00Z"
    },
    {
      project_order: 4,
      title: "Acquisition de deux Scies à béton grand mobile",
      description: "Acquisition d'équipements de découpe de béton pour les travaux de construction",
      location: "Nouakchott",
      status: "en cours",
      progress: 10,
      budget: 8000000,
      start_date: "2025-06-19",
      end_date: "2025-10-21",
      team_size: 2,
      financing_source: "ETR-ML",
      market_type: "Fournitures",
      selection_mode: "Consultation Simplifiée",
      launch_date: "2025-04-14T02:00:00Z",
      attribution_date: "2025-06-16T02:00:00Z",
      completion_date: "2025-10-21T02:00:00Z"
    },
    {
      project_order: 5,
      title: "Formation et consommable pour le parc automobile",
      description: "Formation du personnel et acquisition de consommables pour la maintenance du parc automobile",
      location: "Nouakchott",
      status: "en cours",
      progress: 20,
      budget: 12000000,
      start_date: "2025-06-30",
      end_date: "2025-10-14",
      team_size: 8,
      financing_source: "ETR-ML",
      market_type: "Fournitures",
      selection_mode: "Consultation Simplifiée",
      launch_date: "2025-04-14T02:00:00Z",
      attribution_date: "2025-06-12T02:00:00Z",
      completion_date: "2025-10-14T02:00:00Z"
    },
    {
      project_order: 6,
      title: "Acquisition d'un lot de matériel d'exploitation",
      description: "Acquisition d'équipements divers pour les activités d'exploitation et de maintenance",
      location: "Nouakchott",
      status: "en cours",
      progress: 5,
      budget: 25000000,
      start_date: "2025-06-30",
      end_date: "2025-10-29",
      team_size: 6,
      financing_source: "ETR-ML",
      market_type: "Fournitures",
      selection_mode: "Appel d'Offre National Restreint",
      launch_date: "2025-04-07T02:00:00Z",
      attribution_date: "2025-06-19T02:00:00Z",
      completion_date: "2025-10-29T01:00:00Z"
    },
    {
      project_order: 7,
      title: "Projet de recrutement des bureaux pour les suivis des travaux de construction et réhabilitation des infrastructures sociales et sanitaires en cinq lots",
      description: "Recrutement de bureaux d'études pour le suivi et contrôle des travaux d'infrastructures sociales et sanitaires",
      location: "National (5 lots)",
      status: "en cours",
      progress: 30,
      budget: 35000000,
      start_date: "2025-06-30",
      end_date: "2025-06-21",
      team_size: 20,
      financing_source: "Budget Exceptionnel",
      market_type: "Prestations Intellectuelles",
      selection_mode: "Mode de Sélection au Moindre Coût (SMC)",
      launch_date: "2025-04-22T02:00:00Z",
      attribution_date: "2025-06-30T02:00:00Z",
      completion_date: "2025-06-21T02:00:00Z"
    },
    {
      project_order: 8,
      title: "Projet de Construction et de réhabilitation des infrastructures sociales et sanitaires en 11 lots districts",
      description: "Construction et réhabilitation d'infrastructures sociales et sanitaires réparties en 11 lots géographiques",
      location: "National (11 districts)",
      status: "en cours",
      progress: 40,
      budget: 150000000,
      start_date: "2025-06-30",
      end_date: "2025-06-30",
      team_size: 50,
      financing_source: "Budget Exceptionnel",
      market_type: "Travaux",
      selection_mode: "Appel Offre Durant National",
      launch_date: "2025-04-23T02:00:00Z",
      attribution_date: "2025-06-30T02:00:00Z",
      completion_date: "2025-06-30T02:00:00Z"
    }
  ];

  const importMutation = useMutation({
    mutationFn: async () => {
      const results: any[] = [];
      
      for (let i = 0; i < projects2025.length; i++) {
        const project = projects2025[i];
        
        // Check if project already exists
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('title', project.title as any)
          .maybeSingle();

        if (!existing) {
          const { data, error } = await supabase
            .from('projects')
            .insert(project as any)
            .select()
            .single();

          if (error) {
            console.error(`Error importing project ${project.title}:`, error);
            throw error;
          }
          
          if (data) {
            results.push(data);
          }
        }
        
        // Update progress
        setImportProgress(((i + 1) / projects2025.length) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Import réussi",
        description: `${results.length} nouveaux projets ont été importés avec succès.`,
      });
      setImportProgress(0);
    },
    onError: (error) => {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur s'est produite lors de l'import des projets.",
        variant: "destructive"
      });
      setImportProgress(0);
    }
  });

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import des Projets 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Cette action importera {projects2025.length} projets planifiés pour l'année 2025.
              </p>
              <Button 
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? 'Import en cours...' : 'Importer les projets'}
              </Button>
            </div>
            
            {importMutation.isPending && (
              <div className="space-y-2">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-center text-gray-500">
                  {Math.round(importProgress)}% complété
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu des Projets à Importer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects2025.map((project, index) => (
              <Card key={index} className="p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">#{project.project_order}</Badge>
                      <h3 className="font-medium text-sm">{project.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatBudget(project.budget)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{project.progress}% complété</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {project.financing_source}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.market_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectImporter2025;
