import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  File,
  Image,
  FileBarChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ProjectDocument {
  id: string;
  title: string;
  description?: string;
  file_name?: string;
  file_url?: string;
  mime_type?: string;
  file_size?: number;
  document_type: string;
  status: string;
  created_at: string;
  tags?: string[];
}

interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    document_type: 'project_report',
    file: null as File | null
  });

  const documentTypes = [
    { value: 'project_report', label: 'Rapport de projet', icon: FileBarChart },
    { value: 'contract', label: 'Contrat', icon: FileText },
    { value: 'inspection_report', label: 'Rapport d\'inspection', icon: FileText },
    { value: 'location_photo', label: 'Photo de localisation', icon: Image },
    { value: 'other', label: 'Autre', icon: File }
  ];

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface, handling null values properly
      const transformedDocuments: ProjectDocument[] = (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || undefined,
        file_name: doc.file_name || undefined,
        file_url: doc.file_url || undefined,
        mime_type: doc.mime_type || undefined,
        file_size: doc.file_size || undefined,
        document_type: doc.document_type,
        status: doc.status,
        created_at: doc.created_at,
        tags: doc.tags || undefined
      }));
      
      setDocuments(transformedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents du projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage (if configured)
      // For now, we'll just store the document metadata
      const { error } = await supabase
        .from('documents')
        .insert({
          title: uploadData.title,
          description: uploadData.description,
          document_type: uploadData.document_type,
          file_name: uploadData.file.name,
          mime_type: uploadData.file.type,
          file_size: uploadData.file.size,
          project_id: projectId,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Document ajouté",
        description: "Le document a été ajouté avec succès.",
      });

      setIsUploadDialogOpen(false);
      setUploadData({
        title: '',
        description: '',
        document_type: 'project_report',
        file: null
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le document.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document.",
        variant: "destructive",
      });
    }
  };

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.icon : File;
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : 'Autre';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents du projet
            </CardTitle>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Ajouter un document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                      placeholder="Titre du document"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={uploadData.description}
                      onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                      placeholder="Description du document"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type de document</label>
                    <Select 
                      value={uploadData.document_type} 
                      onValueChange={(value) => setUploadData({...uploadData, document_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fichier</label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      Ajouter le document
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? 'Aucun document' : 'Aucun document trouvé'}
            </h3>
            <p className="text-gray-600 mb-4">
              {documents.length === 0 
                ? 'Commencez par ajouter des documents à ce projet.'
                : 'Essayez de modifier vos critères de recherche.'
              }
            </p>
            {documents.length === 0 && (
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Ajouter un document
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const IconComponent = getDocumentIcon(doc.document_type);
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <IconComponent className="h-6 w-6 text-adrar-600 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{getDocumentTypeLabel(doc.document_type)}</Badge>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {doc.file_name && (
                        <div className="flex justify-between">
                          <span>Fichier:</span>
                          <span className="truncate ml-2">{doc.file_name}</span>
                        </div>
                      )}
                      {doc.file_size && (
                        <div className="flex justify-between">
                          <span>Taille:</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Ajouté:</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="mr-1 h-3 w-3" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="mr-1 h-3 w-3" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;
