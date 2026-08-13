import { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentsList } from '@/hooks/hexagonal';
import { useDocumentViewer } from '@/components/documents/viewer';
import { useDocumentChanges } from '@/components/documents/viewer/documentEvents';

import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

interface DocumentsListProps {
  onDocumentSelect?: (document: DocumentDTO) => void;
}

const DocumentsList = ({ onDocumentSelect }: DocumentsListProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setFilterType(typeParam);
    }
  }, [location.search]);

  const { openDocument } = useDocumentViewer();
  const { data: documents, isLoading, error, refetch } = useDocumentsList({
    searchTerm,
    filterType,
    filterStatus
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'pending_review':
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string | null) => {
    const statuses: Record<string, string> = {
      'draft': 'Brouillon',
      'pending_review': 'En attente de revue',
      'pending_approval': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'archived': 'Archivé'
    };
    return statuses[status || 'draft'] || status || 'Brouillon';
  };


  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (doc: DocumentDTO) => {
    if (!doc.fileUrl) {
      toast({
        title: "Erreur",
        description: "Aucun fichier disponible pour ce document.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = doc.fileName || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (doc: DocumentDTO) => {
    openDocument(doc, { onStatusChanged: () => refetch?.() });
    onDocumentSelect?.(doc);
  };

  // Clear filter and return to all documents
  const clearFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setSearchTerm('');
    navigate('/documents', { replace: true });
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Recherche et Filtres
            </div>
            {filterType !== 'all' && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
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
        {documents?.map(doc => (
          <Card key={doc.id} className="flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base" title={doc.title}>
                    {doc.title || doc.fileName || 'Document'}
                  </CardTitle>
                  <p className="truncate text-xs text-muted-foreground">{doc.fileName || '—'}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{getDocumentTypeLabel(doc.documentType)}</Badge>
                <Badge className={getStatusColor(doc.status)}>{getStatusLabel(doc.status)}</Badge>
              </div>
              {doc.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{doc.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.fileSize ?? null)}
                {doc.createdAt && ` · ${new Date(doc.createdAt).toLocaleDateString('fr-FR')}`}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDocument(doc)}>
                  <Eye className="mr-1 h-4 w-4" />
                  Voir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)} title="Télécharger">
                  <Download className="h-4 w-4" />
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
            <p className="text-gray-500">
              {filterType !== 'all' ? 
                `Aucun document de type "${getDocumentTypeLabel(filterType)}" trouvé` : 
                'Aucun document trouvé'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentsList;
