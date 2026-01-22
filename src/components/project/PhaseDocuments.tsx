import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Download, Eye, Trash2 } from 'lucide-react';
import PhaseDocumentUpload from './phases/PhaseDocumentUpload';
import { usePhaseDocuments, useDocumentDelete } from '@/hooks/hexagonal'

interface PhaseDocumentsProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseDocuments: React.FC<PhaseDocumentsProps> = ({ phaseId, projectId, phaseName }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = usePhaseDocuments(phaseId);
  const deleteDocumentMutation = useDocumentDelete();

  const handleDelete = (id: string) => {
    deleteDocumentMutation.mutate(
      { id, phaseId },
      {
        onSuccess: () => {
          toast({ title: 'Document supprimÃ© avec succÃ¨s' });
        }
      }
    );
  };

  const handleDocumentUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ['phase-documents', phaseId] });
    setIsAdding(false);
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      plan: 'Plan',
      contract: 'Contrat',
      inspection_report: 'Rapport d\'inspection',
      invoice: 'Facture',
      permit: 'Permis',
      photo: 'Photo',
      other: 'Autre',
    };
    return types[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      plan: 'bg-blue-100 text-blue-800',
      contract: 'bg-green-100 text-green-800',
      inspection_report: 'bg-orange-100 text-orange-800',
      invoice: 'bg-purple-100 text-purple-800',
      permit: 'bg-yellow-100 text-yellow-800',
      photo: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des documents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents de la phase ({documents?.length || 0})
          </CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un document Ã  la phase</DialogTitle>
              </DialogHeader>
              <PhaseDocumentUpload
                projectId={projectId}
                phaseId={phaseId}
                phaseName={phaseName}
                onDocumentUploaded={handleDocumentUploaded}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents && documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                    {doc.file_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fichier: {doc.file_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDocumentTypeColor(doc.document_type)}>
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                  <Badge variant="outline">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Date inconnue'}
                  </Badge>
                  {doc.status && (
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun document assignÃ© Ã  cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseDocuments;
