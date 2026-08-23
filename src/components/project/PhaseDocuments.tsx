import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Download, Eye, Trash2 } from 'lucide-react';
import PhaseDocumentUpload from './phases/PhaseDocumentUpload';
import { usePhaseDocuments, useDocumentDelete } from '@/hooks/hexagonal';

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
interface PhaseDocumentsProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseDocuments: React.FC<PhaseDocumentsProps> = ({ phaseId, projectId, phaseName }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { documents, isLoading } = usePhaseDocuments(phaseId);
  const deleteDocumentMutation = useDocumentDelete();

  const handleDelete = (id: string) => {
    deleteDocumentMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Document supprimé avec succès' });
        queryClient.invalidateQueries({ queryKey: ['documents', 'phase', phaseId] });
      }
    });
  };

  const handleDocumentUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ['documents', 'phase', phaseId] });
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
      plan: 'bg-primary/10 text-primary',
      contract: 'bg-success-soft text-success',
      inspection_report: 'bg-warning/10 text-warning',
      invoice: 'bg-purple-100 text-purple-800',
      permit: 'bg-warning/10 text-warning',
      photo: 'bg-pink-100 text-pink-800',
      other: 'bg-muted text-foreground',
    };
    return colors[type] || colors.other;
  };

  if (isLoading) {
    return <div className="animate-pulse"><T k="auto.phasedocuments.chargement_des_documents" fallback="Chargement des documents..." /></div>;
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
                <T k="auto.phasedocuments.ajouter_un_document" fallback="Ajouter un document" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle><T k="auto.phasedocuments.ajouter_un_document_a_la_phase" fallback="Ajouter un document à la phase" /></DialogTitle>
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
                    {(doc as any).file_name || doc.fileName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fichier: {(doc as any).file_name || doc.fileName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {((doc as any).file_url || doc.fileUrl) && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={(doc as any).file_url || doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={(doc as any).file_url || doc.fileUrl} download>
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
                  <Badge className={getDocumentTypeColor((doc as any).document_type || doc.documentType)}>
                    {getDocumentTypeLabel((doc as any).document_type || doc.documentType)}
                  </Badge>
                  <Badge variant="outline">
                    {((doc as any).created_at || doc.createdAt) ? new Date((doc as any).created_at || doc.createdAt).toLocaleDateString() : 'Date inconnue'}
                  </Badge>
                  {doc.status && (
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                      <TranslatedStatus code={doc.status} />
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground"><T k="auto.phasedocuments.aucun_document_assigne_a_cette_phase" fallback="Aucun document assigné à cette phase." /></p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseDocuments;
