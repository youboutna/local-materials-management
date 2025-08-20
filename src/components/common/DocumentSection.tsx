import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { toast } from '@/hooks/use-toast';

interface DocumentSectionProps {
  relatedId: string;
  relatedType: 'project' | 'inspection' | 'payment' | 'bank_guarantee' | 'insurance';
  title?: string;
}

interface LocalDocument {
  id: string;
  title: string;
  description?: string | null;
  document_type: string;
  status: string;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
  uploaded_by: string;
  project_id: string;
  mime_type?: string | null;
  assigned_to?: string | null;
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  relatedId,
  relatedType,
  title = "Documents associés"
}) => {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<LocalDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [relatedId]);

  const loadDocuments = async () => {
    if (!relatedId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter based on related type
      switch (relatedType) {
        case 'project':
          query = query.eq('project_id', relatedId);
          break;
        case 'inspection':
          query = query.eq('inspection_id', relatedId);
          break;
        case 'payment':
          query = query.eq('related_id', relatedId).contains('tags', ['payment']);
          break;
        case 'bank_guarantee':
          query = query.eq('related_id', relatedId).contains('tags', ['bank_guarantee']);
          break;
        case 'insurance':
          query = query.eq('related_id', relatedId).contains('tags', ['insurance']);
          break;
        default:
          query = query.eq('related_id', relatedId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading documents:', error);
        throw error;
      }

      setDocuments((data || []).map(doc => ({
        ...doc,
        description: doc.description || undefined,
        mime_type: doc.mime_type || undefined,
        assigned_to: doc.assigned_to || undefined,
        status: doc.status || 'draft',
        uploaded_by: doc.uploaded_by || '',
        created_at: doc.created_at || '',
        title: doc.title || 'Untitled',
        file_name: doc.file_name || '',
        file_url: doc.file_url || '',
        file_size: doc.file_size || 0,
        project_id: doc.project_id || ''
      })));
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les documents: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDocumentList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun document associé</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-sm">{document.title}</h4>
                    <p className="text-xs text-gray-500">{document.file_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDocument(document)}
                  >
                    Voir
                  </Button>
                  {document.file_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(document.file_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">
            Liste ({documents.length})
          </TabsTrigger>
          {selectedDocument && (
            <TabsTrigger value="viewer">
              Visualisation
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          {renderDocumentList()}
        </TabsContent>
        
        {selectedDocument && (
          <TabsContent value="viewer" className="mt-4">
            <DocumentViewer document={{
              ...selectedDocument,
              description: selectedDocument.description || '',
              mime_type: selectedDocument.mime_type || undefined
            }} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DocumentSection;