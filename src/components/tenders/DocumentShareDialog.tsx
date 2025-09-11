import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProcurementPhase } from './PublicProcurementWorkflow';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  document_type: string;
  created_at: string;
  is_shared_with_suppliers: boolean;
  metadata?: {
    tender_id?: string;
    phase?: string;
  };
}

interface DocumentShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  phase: ProcurementPhase;
  phaseTitle: string;
}

const DocumentShareDialog = ({ isOpen, onClose, tenderId, phase, phaseTitle }: DocumentShareDialogProps) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available documents for the tender
  const { data: documents, isLoading } = useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .or(`metadata->tender_id.eq.${tenderId},metadata.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: isOpen && !!tenderId
  });

  // Share documents mutation
  const shareDocumentsMutation = useMutation({
    mutationFn: async () => {
      if (selectedDocuments.length === 0) {
        throw new Error('Aucun document sélectionné');
      }

      const { data: user } = await supabase.auth.getUser();
      
      // Update each document individually
      for (const docId of selectedDocuments) {
        const { error } = await supabase
          .from('documents')
          .update({
            is_shared_with_suppliers: true,
            shared_date: new Date().toISOString(),
            metadata: {
              tender_id: tenderId,
              phase: phase,
              shared_by: user.user?.id
            }
          })
          .eq('id', docId);

        if (error) throw error;
      }

      return selectedDocuments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents'] });
      queryClient.invalidateQueries({ queryKey: ['shared-documents'] });
      toast({
        title: 'Documents partagés',
        description: `${selectedDocuments.length} document(s) partagé(s) avec les fournisseurs pour la phase ${phaseTitle}`,
      });
      setSelectedDocuments([]);
      onClose();
    },
    onError: (error) => {
      console.error('Share documents error:', error);
      toast({
        title: 'Erreur',
        description: 'Échec du partage des documents',
        variant: 'destructive',
      });
    }
  });

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleShare = () => {
    shareDocumentsMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager des Documents - {phaseTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <p className="text-sm text-muted-foreground">
            Sélectionnez les documents à partager avec les fournisseurs pour cette phase.
            Les documents partagés seront visibles dans le portail fournisseurs.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => {
                const isSelected = selectedDocuments.includes(doc.id);
                const isAlreadyShared = doc.is_shared_with_suppliers;
                
                return (
                  <Card 
                    key={doc.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isAlreadyShared ? 'bg-green-50 border-green-200' : ''}`}
                    onClick={() => toggleDocumentSelection(doc.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.title}</h4>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {doc.document_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isAlreadyShared && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Partagé
                            </Badge>
                          )}
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun document disponible pour cet appel d'offres</p>
              <p className="text-sm mt-1">
                Ajoutez des documents dans la section Documents avant de les partager
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {selectedDocuments.length > 0 && (
              <span>{selectedDocuments.length} document(s) sélectionné(s)</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleShare}
              disabled={selectedDocuments.length === 0 || shareDocumentsMutation.isPending}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {shareDocumentsMutation.isPending ? 'Partage...' : `Partager (${selectedDocuments.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentShareDialog;