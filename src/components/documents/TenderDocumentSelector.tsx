
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, Search } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  file_name: string | null;
  file_url: string | null;
  document_type: string;
  created_at: string;
  uploaded_by: string | null;
}

interface TenderDocumentSelectorProps {
  onDocumentSelect: (document: Document | null, file?: File) => void;
  selectedDocument?: Document | null;
  allowUpload?: boolean;
}

const TenderDocumentSelector: React.FC<TenderDocumentSelectorProps> = ({
  onDocumentSelect,
  selectedDocument,
  allowUpload = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { uploadFile: uploadToStorage, uploading } = useDocumentStorage();

  // Fetch tender documents
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['tender-documents', searchTerm],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'tender')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(doc => ({
        id: doc.id,
        title: doc.title || '',
        file_name: doc.file_name,
        file_url: doc.file_url,
        document_type: doc.document_type,
        created_at: doc.created_at || new Date().toISOString(),
        uploaded_by: doc.uploaded_by
      }));
    },
  });

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier et saisir un titre",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload file to storage
      const uploadResult = await uploadToStorage(uploadFile, `tender-documents/${uploadFile.name}`);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('Échec du téléchargement du fichier');
      }

      // Save document to database
      const { data: newDocument, error } = await supabase
        .from('documents')
        .insert({
          title: uploadTitle,
          file_name: uploadFile.name,
          file_url: uploadResult.url,
          document_type: 'tender',
          mime_type: uploadFile.type,
          file_size: uploadFile.size
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Document téléchargé",
        description: "Le document d'appel d'offres a été téléchargé avec succès"
      });

      // Select the newly uploaded document
      const mappedDocument: Document = {
        id: newDocument.id,
        title: newDocument.title || '',
        file_name: newDocument.file_name,
        file_url: newDocument.file_url,
        document_type: newDocument.document_type,
        created_at: newDocument.created_at || new Date().toISOString(),
        uploaded_by: newDocument.uploaded_by
      };
      
      onDocumentSelect(mappedDocument, uploadFile);
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      refetch();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Document d'appel d'offres</Label>
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {allowUpload && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Télécharger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Télécharger un document d'appel d'offres</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="uploadTitle">Titre du document</Label>
                    <Input
                      id="uploadTitle"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Ex: Appel d'offres Construction École Primaire"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fileUpload">Fichier</Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleFileUpload}
                      disabled={uploading || !uploadFile || !uploadTitle}
                    >
                      {uploading ? 'Téléchargement...' : 'Télécharger'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Document Selection */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <Select 
          value={selectedDocument?.id || ''} 
          onValueChange={(value) => {
            const document = documents?.find(d => d.id === value);
            onDocumentSelect(document || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un document d'appel d'offres" />
          </SelectTrigger>
          <SelectContent>
            {documents?.map((document) => (
              <SelectItem key={document.id} value={document.id}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{document.title}</div>
                    <div className="text-xs text-gray-500">
                      {document.file_name} • {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
            {documents?.length === 0 && (
              <SelectItem value="no-documents" disabled>
                Aucun document trouvé
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {/* Selected Document Info */}
      {selectedDocument && (
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">{selectedDocument.title}</div>
              <div className="text-sm text-gray-600">
                {selectedDocument.file_name} • Créé le {new Date(selectedDocument.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderDocumentSelector;
