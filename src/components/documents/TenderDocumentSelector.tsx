
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Calendar, User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_name?: string;
  created_at: string;
  uploaded_by?: string;
  file_size?: number;
}

interface TenderDocumentSelectorProps {
  tenderId: string;
  onDocumentsSelected: (documentIds: string[]) => void;
  allowMultipleSelection?: boolean;
}

const TenderDocumentSelector: React.FC<TenderDocumentSelectorProps> = ({
  tenderId,
  onDocumentsSelected,
  allowMultipleSelection = false
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Fetch documents related to the tender
  const { data: documents, isLoading } = useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async (): Promise<Document[]> => {
      // First, try to get documents directly associated with the tender
      let query = supabase
        .from('documents')
        .select('*')
        .or(`metadata->>'tender_id'.eq.${tenderId},metadata->>'related_tender_id'.eq.${tenderId}`)
        .order('created_at', { ascending: false });

      const { data: tenderDocs, error: tenderError } = await query;

      if (tenderError) {
        console.error('Error fetching tender documents:', tenderError);
      }

      // Also get documents from the tender's associated project if available
      const { data: tender } = await supabase
        .from('tenders')
        .select('project_id')
        .eq('id', tenderId)
        .single();

      let projectDocs: Document[] = [];
      if (tender?.project_id) {
        const { data: projDocs, error: projError } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', tender.project_id)
          .order('created_at', { ascending: false });

        if (!projError && projDocs) {
          projectDocs = projDocs as Document[];
        }
      }

      // Combine and deduplicate documents
      const allDocs = [...(tenderDocs || []), ...projectDocs];
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );

      return uniqueDocs as Document[];
    },
  });

  const handleDocumentToggle = (documentId: string) => {
    if (allowMultipleSelection) {
      setSelectedDocuments(prev => 
        prev.includes(documentId)
          ? prev.filter(id => id !== documentId)
          : [...prev, documentId]
      );
    } else {
      setSelectedDocuments([documentId]);
    }
  };

  const handleConfirmSelection = () => {
    onDocumentsSelected(selectedDocuments);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {allowMultipleSelection ? 'Sélectionnez les documents à partager:' : 'Sélectionnez un document à partager:'}
        </p>
        <Badge variant="outline">
          {documents?.length || 0} document(s) disponible(s)
        </Badge>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {documents?.length ? (
          documents.map((doc) => {
            const isSelected = selectedDocuments.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleDocumentToggle(doc.id)}
              >
                <div className="flex items-center space-x-3">
                  {allowMultipleSelection ? (
                    <Checkbox checked={isSelected} readOnly />
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                  )}
                  
                  <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {doc.document_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                      </div>
                      
                      {doc.file_name && (
                        <span className="truncate">{doc.file_name}</span>
                      )}
                      
                      {doc.file_size && (
                        <span>{formatFileSize(doc.file_size)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun document trouvé pour cet appel d'offres</p>
            <p className="text-sm mt-1">Ajoutez des documents dans l'onglet "Documents" pour les partager.</p>
          </div>
        )}
      </div>

      {documents?.length > 0 && (
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedDocuments.length === 0}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirmer la sélection ({selectedDocuments.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default TenderDocumentSelector;
