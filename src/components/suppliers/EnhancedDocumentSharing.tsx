import { getNotificationService } from '@/application/services/NotificationService';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/hexagonal/useAuthSimple';
import { useDocumentsHex } from '@/hooks/hexagonal/useDocumentsHex';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Send, Upload } from 'lucide-react';
import React, { useState } from 'react';

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
  const { user } = useAuth();
  const { documents, isLoading, createDocument } = useDocumentsHex();

  // Filter documents based on search and filters
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedDocumentType || (doc as any).document_type === selectedDocumentType || doc.documentType === selectedDocumentType;
    const matchesProject = !selectedProject || (doc as any).project_id === selectedProject || doc.projectId === selectedProject;
    
    return matchesSearch && matchesType && matchesProject;
  }) || [];

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      try {
        console.info('ENHANCED_DOCUMENT_SHARING_001: Starting document upload', {
          code: 'ENHANCED_DOCUMENT_SHARING_001',
          message: 'Début du téléchargement de document',
          supplierId: supplier.id,
          supplierName: supplier.name,
          fileName: selectedFile?.name,
          stack: new Error().stack
        });

        if (!user) {
          console.error('ENHANCED_DOCUMENT_SHARING_002: User not authenticated', {
            code: 'ENHANCED_DOCUMENT_SHARING_002',
            message: 'Utilisateur non authentifié pour le téléchargement',
            supplierId: supplier.id,
            stack: new Error().stack
          });
          throw new Error('ENHANCED_DOCUMENT_SHARING_002: Vous devez être connecté pour uploader un document');
        }

        if (!selectedFile) {
          console.error('ENHANCED_DOCUMENT_SHARING_003: No file selected', {
            code: 'ENHANCED_DOCUMENT_SHARING_003',
            message: 'Aucun fichier sélectionné pour le téléchargement',
            supplierId: supplier.id,
            stack: new Error().stack
          });
          throw new Error('ENHANCED_DOCUMENT_SHARING_003: Aucun fichier sélectionné');
        }
        
        // Upload file
        const uploadResult = await uploadFile(selectedFile, `documents/${selectedFile.name}`);
        if (!uploadResult.success) {
          console.error('ENHANCED_DOCUMENT_SHARING_004: File upload failed', {
            code: 'ENHANCED_DOCUMENT_SHARING_004',
            message: 'Échec du téléchargement du fichier',
            supplierId: supplier.id,
            fileName: selectedFile.name,
            technicalError: uploadResult.error,
            stack: new Error().stack
          });
          throw new Error(`ENHANCED_DOCUMENT_SHARING_004: ${uploadResult.error || 'Erreur lors du téléchargement'}`);
        }

        console.info('ENHANCED_DOCUMENT_SHARING_005: File uploaded successfully', {
          code: 'ENHANCED_DOCUMENT_SHARING_005',
          message: 'Fichier téléchargé avec succès',
          supplierId: supplier.id,
          fileName: selectedFile.name,
          fileUrl: uploadResult.url,
          stack: new Error().stack
        });

        // Create document record using hexagonal hook
        await createDocument({
          title: uploadFormData.title,
          documentType: 'contract' as any,
          description: uploadFormData.description,
          projectId: uploadFormData.project_id || null,
          fileUrl: uploadResult.url,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          uploadedBy: user.id,
          status: 'draft',
          category: 'general',
          subcategory: 'other'
        });

        console.info('ENHANCED_DOCUMENT_SHARING_006: Document created successfully', {
          code: 'ENHANCED_DOCUMENT_SHARING_006',
          message: 'Document créé avec succès dans la base de données',
          supplierId: supplier.id,
          documentTitle: uploadFormData.title,
          stack: new Error().stack
        });
      } catch (error) {
        console.error('ENHANCED_DOCUMENT_SHARING_007: Upload mutation failed', {
          code: 'ENHANCED_DOCUMENT_SHARING_007',
          message: 'Échec de la mutation de téléchargement',
          supplierId: supplier.id,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
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
    try {
      console.info('ENHANCED_DOCUMENT_SHARING_008: Starting document share', {
        code: 'ENHANCED_DOCUMENT_SHARING_008',
        message: 'Début du partage de document',
        documentId,
        documentTitle,
        supplierId: supplier.id,
        supplierName: supplier.name,
        stack: new Error().stack
      });

      if (!user) {
        console.error('ENHANCED_DOCUMENT_SHARING_009: User not authenticated for sharing', {
          code: 'ENHANCED_DOCUMENT_SHARING_009',
          message: 'Utilisateur non authentifié pour le partage',
          documentId,
          supplierId: supplier.id,
          stack: new Error().stack
        });
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour partager un document.",
          variant: "destructive"
        });
        return;
      }

      if (!supplier.email) {
        console.error('ENHANCED_DOCUMENT_SHARING_010: Supplier has no email', {
          code: 'ENHANCED_DOCUMENT_SHARING_010',
          message: 'Le fournisseur n\'a pas d\'adresse email',
          documentId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          stack: new Error().stack
        });
        toast({
          title: "Erreur",
          description: "Ce fournisseur n'a pas d'adresse email.",
          variant: "destructive"
        });
        return;
      }

      // Create notification using NotificationService
      const notificationService = getNotificationService();
      await notificationService.createNotification({
        recipientId: supplier.id,
        type: 'info',
        title: 'Nouveau document partagé',
        message: `Le document "${documentTitle}" a été partagé avec vous.`,
        metadata: {
          document_id: documentId,
          document_title: documentTitle,
          shared_by: user.id,
          action: 'document_shared'
        }
      });

      console.info('ENHANCED_DOCUMENT_SHARING_011: Document shared successfully', {
        code: 'ENHANCED_DOCUMENT_SHARING_011',
        message: 'Document partagé avec succès',
        documentId,
        documentTitle,
        supplierId: supplier.id,
        supplierEmail: supplier.email,
        stack: new Error().stack
      });
      
      toast({
        title: "Succès",
        description: `Document "${documentTitle}" partagé avec ${supplier.name || 'ce fournisseur'}`,
      });
    } catch (error) {
      console.error('ENHANCED_DOCUMENT_SHARING_012: Document share failed', {
        code: 'ENHANCED_DOCUMENT_SHARING_012',
        message: 'Échec du partage de document',
        documentId,
        documentTitle,
        supplierId: supplier.id,
        technicalError: error,
        stack: new Error().stack
      });
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
                                  {DOCUMENT_TYPES.find(t => t.value === ((doc as any).document_type || doc.documentType))?.label || (doc as any).document_type || doc.documentType}
                                </Badge>
                                <span>•</span>
                                <span>{(doc.createdAt || (doc as any).created_at) ? new Date(doc.createdAt || (doc as any).created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
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