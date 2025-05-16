
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inspection, InspectionStatus } from '@/types/project';
import { format } from 'date-fns';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InspectionsListProps {
  projectId: string;
}

export function InspectionsList({ projectId }: InspectionsListProps) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Cast the data to the correct type
      const typedData = data as unknown as Inspection[];
      setInspections(typedData || []);
    } catch (error: any) {
      console.error('Error fetching inspections:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les inspections du projet.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInspections();
  }, [projectId]);
  
  const getStatusText = (status: InspectionStatus): StatusType => {
    switch (status) {
      case 'approved': return 'approuvée';
      case 'requires_changes': return 'modifications requises';
      case 'rejected': return 'rejetée';
      case 'pending': return 'en attente';
      default: return 'en attente';
    }
  };
  
  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-adrar-600 border-t-transparent"></div>
            <span className="ml-2">Chargement des inspections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Aucune inspection n'a été réalisée pour ce projet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inspections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inspections.map((inspection) => (
            <div 
              key={inspection.id} 
              className="border rounded-lg overflow-hidden"
            >
              <div 
                className="flex justify-between items-center p-4 bg-muted/30 cursor-pointer"
                onClick={() => handleToggleExpand(inspection.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="font-medium">{format(new Date(inspection.date), 'dd/MM/yyyy')}</div>
                  <StatusBadge status={getStatusText(inspection.status as InspectionStatus)} />
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedId === inspection.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {expandedId === inspection.id && (
                <div className="p-4 border-t">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Inspecteur:</div>
                      <div>{inspection.inspector}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Progression au moment de l'inspection:</div>
                      <div>{inspection.progress_at_inspection}%</div>
                    </div>
                    
                    {inspection.comments && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Commentaires:</div>
                        <div className="whitespace-pre-wrap">{inspection.comments}</div>
                      </div>
                    )}
                    
                    {inspection.status === 'requires_changes' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                        <div className="font-medium text-amber-800">Actions requises</div>
                        <p className="text-sm text-amber-700 mt-1">
                          Des modifications ont été demandées. Veuillez consulter les commentaires 
                          et apporter les corrections nécessaires avant de demander une nouvelle inspection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
