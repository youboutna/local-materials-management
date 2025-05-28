import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentType = Database['public']['Enums']['document_type'];
type DocumentStatus = Database['public']['Enums']['document_status'];

const DocumentsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', searchTerm, filterType, filterStatus],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filterType !== 'all') {
        query = query.eq('document_type', filterType as DocumentType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus as DocumentStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Document[]) || [];
    },
  });

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'inspection_report': 'Rapport d\'inspection',
      'location_photo': 'Photo de localisation',
      'project_report': 'Rapport de projet',
      'contract': 'Contrat',
      'supplier_info': 'Information fournisseur',
      'task_assignment': 'Affectation de tâche',
      'employee_record': 'Dossier employé'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      'draft': 'Brouillon',
      'pending_review': 'En attente de révision',
      'approved': 'Approuvé'
    };
    return statuses[status] || status;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (document: Document) => {
    if (!document.file_url) {
      toast({
        title: "Erreur",
        description: "Aucun fichier disponible pour ce document.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erreur lors du chargement des documents: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <Input
                placeholder="Rechercher par titre ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de document</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="inspection_report">Rapport d'inspection</SelectItem>
                  <SelectItem value="location_photo">Photo de localisation</SelectItem>
                  <SelectItem value="project_report">Rapport de projet</SelectItem>
                  <SelectItem value="contract">Contrat</SelectItem>
                  <SelectItem value="supplier_info">Information fournisseur</SelectItem>
                  <SelectItem value="task_assignment">Affectation de tâche</SelectItem>
                  <SelectItem value="employee_record">Dossier employé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending_review">En attente de révision</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents?.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{document.title}</h3>
                    <p className="text-sm text-gray-500">
                      {getDocumentTypeLabel(document.document_type)}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(document.status || 'draft')}>
                  {getStatusLabel(document.status || 'draft')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {document.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {document.description}
                </p>
              )}
              
              <div className="space-y-2 text-xs text-gray-500">
                {document.file_name && (
                  <div>Fichier: {document.file_name}</div>
                )}
                {document.file_size && (
                  <div>Taille: {formatFileSize(document.file_size)}</div>
                )}
                <div>
                  Créé: {new Date(document.created_at || '').toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                {document.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun document trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentsList;
