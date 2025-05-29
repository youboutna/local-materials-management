
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, FileText, MessageSquare, User } from 'lucide-react';
import StatusBadge, { StatusType } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InspectionData {
  id: string;
  date: string;
  status: StatusType;
  inspector: string;
  progress_at_inspection: number;
  comments?: string | null;
  documents?: { name: string; url: string }[];
}

interface InspectionsListProps {
  projectId: string;
}

export const InspectionsList = ({ projectId }: InspectionsListProps) => {
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<InspectionData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('project_id', projectId as any)
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data to match InspectionData type
        const formattedData: InspectionData[] = (data || []).map((item: any) => ({
          id: item.id,
          date: item.date,
          status: item.status as StatusType,
          inspector: item.inspector,
          progress_at_inspection: item.progress_at_inspection,
          comments: item.comments,
          documents: item.documents as { name: string; url: string }[] | undefined
        }));

        setInspections(formattedData);
      } catch (error) {
        console.error('Error fetching inspections:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les inspections.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [projectId, toast]);

  const handleViewDetails = (inspection: InspectionData) => {
    setSelectedInspection(inspection);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement des inspections...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-terracotta-500 border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Historique des inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune inspection n'a encore été effectuée pour ce projet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-medium">Inspection du {new Date(inspection.date).toLocaleDateString()}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{inspection.inspector}</span>
                      </div>
                    </div>
                    <StatusBadge status={inspection.status} />
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {inspection.comments ? 'Avec commentaires' : 'Pas de commentaires'}
                      </span>
                    </div>
                    
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(inspection)}>
                      Voir les détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={(open) => !open && setShowDetails(false)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails de l'inspection</DialogTitle>
            <DialogDescription>
              {selectedInspection && (
                <span>Inspection effectuée le {new Date(selectedInspection.date).toLocaleDateString()}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedInspection && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(selectedInspection.date).toLocaleDateString()}</span>
                  </div>
                  <StatusBadge status={selectedInspection.status} />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Inspecteur</h4>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInspection.inspector}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Progression au moment de l'inspection</h4>
                  <div className="bg-muted rounded-md p-4 text-center">
                    <span className="text-2xl font-bold">{selectedInspection.progress_at_inspection}%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Commentaires</h4>
                  <div className="bg-muted rounded-md p-4">
                    {selectedInspection.comments ? (
                      <p className="whitespace-pre-line">{selectedInspection.comments}</p>
                    ) : (
                      <p className="text-center text-muted-foreground">Aucun commentaire</p>
                    )}
                  </div>
                </div>
                
                {selectedInspection.documents && selectedInspection.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Documents</h4>
                    <div className="space-y-2">
                      {selectedInspection.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{doc.name}</span>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              Voir
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
