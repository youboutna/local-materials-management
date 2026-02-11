import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowStepService, WorkflowStepService } from '@/application/services/WorkflowStepService';
import { WorkflowStepDTO, StepDocumentDTO } from '@/dtos/entities/ProjectReportDTO';
import { FileText, Plus, Eye, CheckCircle, AlertTriangle } from 'lucide-react';

interface StepDocumentsSectionProps {
  step: WorkflowStepDTO;
  readonly?: boolean;
  onOpenAddDocument: (step: WorkflowStepDTO) => void;
}

const StepDocumentsSection: React.FC<StepDocumentsSectionProps> = ({ step, readonly = false, onOpenAddDocument }) => {
  const { data: stepDocuments = [], isLoading } = useQuery<StepDocumentDTO[]>({
    queryKey: ['step-documents', step.id],
    queryFn: () => WorkflowStepService.getStepDocuments(step.id),
    enabled: !!step.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Documents</h4>
        {!readonly && step.can_upload_documents && (
          <Button size="sm" variant="outline" onClick={() => onOpenAddDocument(step)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>

      {!step.can_upload_documents && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Upload de documents non disponible pour cette étape (statut: {step.status})
          </p>
        </div>
      )}

      {step.required_documents && step.required_documents.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-muted-foreground">Documents requis:</h5>
          <div className="grid gap-2">
            {step.required_documents.map((docType, index) => {
              const hasDocument = stepDocuments.some(doc =>
                doc.document_type === docType || doc.document.title.toLowerCase().includes(docType.toLowerCase())
              );
              return (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {hasDocument ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="text-sm">{docType}</span>
                  {hasDocument && <Badge variant="secondary" className="ml-auto">Fourni</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm">Chargement des documents...</span>
        </div>
      ) : stepDocuments.length > 0 ? (
        <div className="grid gap-2">
          {stepDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 p-3 border rounded">
              <FileText className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium text-sm">{doc.document.title}</div>
                {doc.document.description && (
                  <div className="text-xs text-muted-foreground">{doc.document.description}</div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Type: {doc.document_type} | Requis: {doc.is_required ? 'Oui' : 'Non'}
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(doc.status)}>
                {getStatusIcon(doc.status)}
                <span className="ml-1">
                  {doc.status === 'pending'
                    ? 'En attente'
                    : doc.status === 'submitted'
                    ? 'Soumis'
                    : doc.status === 'approved'
                    ? 'Approuvé'
                    : doc.status === 'rejected'
                    ? 'Rejeté'
                    : doc.status}
                </span>
              </Badge>
              {doc.document.file_url && (
                <Button size="sm" variant="ghost" onClick={() => window.open(doc.document.file_url!, '_blank')}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Aucun document pour cette étape.</p>
          {step.can_upload_documents && !readonly && (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => onOpenAddDocument(step)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter le premier document
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default StepDocumentsSection;
