import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { StorageService } from '@/application/services/StorageService';
import { NotificationService } from '@/application/services/NotificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Send, Plus, Search } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import ProjectSelector from '@/components/selectors/ProjectSelector';

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_url?: string | null;
  file_name?: string | null;
  created_at: string | null;
  project_id?: string | null;
  description?: string | null;
}

interface Supplier {
  id: string;
  name: string | null;
  email?: string | null;
  contact_person?: string | null;
}

interface EnhancedDocumentSharingProps {
  supplier: Supplier;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'plan', label: 'Plan' },
  { value: 'photo', label: 'Photo' },
  { value: 'invoice', label: 'Facture' },
  { value: 'purchase_order', label: 'Bon de commande' },
  { value: 'inquiry', label: 'Demande de renseignements' },
  { value: 'contract', label: 'Contrat' },
  { value: 'report', label: 'Rapport' },
  { value: 'certificate', label: 'Certificat' },
  { value: 'specification', label: 'Spécification' }
];

export const EnhancedDocumentSharing: React.FC<EnhancedDocumentSharingProps> = ({
  supplier,
  isOpen,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState('share');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    document_type: '',
    description: '',
    project_id: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  // Fetch documents with filters
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents-for-sharing', searchTerm, selectedDocumentType, selectedProject],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select(`
          id, title, document_type, file_url, file_name, 
          created_at, project_id, description
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedDocumentType) {
        // Filter by valid document types from database enum
        query = query.eq('document_type', 'contract'); // Use a valid enum value
      }
      
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []).map(doc => ({
        ...doc,
        created_at: doc.created_at || new Date().toISOString()
      })) as Document[];
    },
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Vous devez être connecté pour uploader un document');
      }

      if (!selectedFile) throw new Error('Aucun fichier sélectionné');
      
      // Upload file
      const uploadResult = await uploadFile(selectedFile, `documents/${selectedFile.name}`);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Erreur lors du téléchargement');
      }

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: uploadFormData.title,
          document_type: 'contract', // Use a valid document type from enum
          description: uploadFormData.description,
          project_id: uploadFormData.project_id || null,
          file_url: uploadResult.url,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: session.user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newDocument) => {
      queryClient.invalidateQueries({ queryKey: ['documents-for-sharing'] });
      toast({
        title: "Succès",
        description: "Document téléchargé avec succès"
      });
      
      // Reset form
      setUploadFormData({
        title: '',
        document_type: '',
        description: '',
        project_id: ''
      });
      setSelectedFile(null);
      
      // Auto-share the uploaded document
      handleShareDocument(newDocument.id, uploadFormData.title || newDocument.file_name || 'Document');
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Share document function
  const handleShareDocument = async (documentId: string, documentTitle: string) => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour partager un document.",
        variant: "destructive"
      });
      return;
    }

    if (!supplier.email) {
      toast({
        title: "Erreur",
        description: "Ce fournisseur n'a pas d'adresse email.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create notification
      await NotificationService.createNotification({
        recipient_id: supplier.id,
        type: 'supplier_payment_request',
        title: 'Nouveau document partagé',
        message: `Le document "${documentTitle}" a été partagé avec vous.`,
        related_id: documentId,
        metadata: {
          document_id: documentId,
          document_title: documentTitle,
          shared_by: session.user.id,
          action: 'document_shared'
        }
      });

      // Send email notification
      await sendSupplierNotification({
        type: 'task_assignment',
        email: supplier.email || '',
        supplier_name: supplier.name || '',
        supplier_id: supplier.id,
        task_title: `Document partagé: ${documentTitle}`
      });
      
      toast({
        title: "Succès",
        description: `Document "${documentTitle}" partagé avec ${supplier.name || 'ce fournisseur'}`,
      });
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du partage du document",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!uploadFormData.title) {
        setUploadFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, "")
        }));
      }
    }
  };

  const resetUploadForm = () => {
    setUploadFormData({
      title: '',
      document_type: '',
      description: '',
      project_id: ''
    });
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gestion des documents - {supplier.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Partager des documents</TabsTrigger>
            <TabsTrigger value="upload">Télécharger nouveau document</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rechercher</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Titre ou description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type de document</label>
                    <Select value={selectedDocumentType || "all-types"} onValueChange={(value) => setSelectedDocumentType(value === "all-types" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">Tous les types</SelectItem>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Projet</label>
                    <ProjectSelector
                      value={selectedProject}
                      onChange={(projectId) => setSelectedProject(projectId || '')}
                      placeholder="Tous les projets"
                      secureMode={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {documents?.length ? (
                      documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div className="flex-1">
                              <div className="font-medium">{doc.title}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Badge variant="outline">
                                  {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                                </Badge>
                                <span>•</span>
                                <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                              </div>
                              {doc.description && (
                                <div className="text-sm text-gray-600 mt-1">{doc.description}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleShareDocument(doc.id, doc.title)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Partager
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun document trouvé</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Télécharger un nouveau document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Titre *</label>
                    <Input
                      value={uploadFormData.title}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Titre du document"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type de document *</label>
                    <Select 
                      value={uploadFormData.document_type} 
                      onValueChange={(value) => setUploadFormData(prev => ({ ...prev, document_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Projet (optionnel)</label>
                  <ProjectSelector
                    value={uploadFormData.project_id}
                    onChange={(projectId) => setUploadFormData(prev => ({ ...prev, project_id: projectId || '' }))}
                    placeholder="Associer à un projet"
                    secureMode={true}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du document"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Fichier *</label>
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Fichier sélectionné: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => uploadMutation.mutate()}
                    disabled={uploading || !selectedFile || !uploadFormData.title || !uploadFormData.document_type}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Télécharger et partager
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetUploadForm}>
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDocumentSharing;