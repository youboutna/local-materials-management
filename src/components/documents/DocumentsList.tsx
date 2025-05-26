

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Camera, FileBarChart, FileCheck, Building2, ClipboardList, Users, Download, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import DocumentDetails from './DocumentDetails';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

const DocumentsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const { downloadFile, downloading } = useDocumentStorage();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', typeFilter, statusFilter],
    queryFn: async (): Promise<Document[]> => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('document_type', typeFilter as Database['public']['Enums']['document_type']);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as Database['public']['Enums']['document_status']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Document[]) || [];
    },
  });

  const getDocumentIcon = (type: string) => {
    const icons = {
      inspection_report: FileText,
      location_photo: Camera,
      project_report: FileBarChart,
      contract: FileCheck,
      supplier_info: Building2,
      task_assignment: ClipboardList,
      employee_record: Users
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (fileUrl: string | null, fileName: string | null) => {
    if (!fileUrl || !fileName) {
      toast({
        title: "Erreur",
        description: "Fichier non disponible pour le téléchargement.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await downloadFile(fileUrl, fileName);
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Fichier téléchargé avec succès.",
        });
      } else {
        throw new Error(result.error || 'Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setDetailsOpen(true);
  };

  const filteredDocuments = documents?.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-adrar-600">Chargement des documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="inspection_report">Rapports d'inspection</SelectItem>
                <SelectItem value="location_photo">Photos de localisation</SelectItem>
                <SelectItem value="project_report">Rapports de projet</SelectItem>
                <SelectItem value="contract">Contrats</SelectItem>
                <SelectItem value="supplier_info">Informations fournisseurs</SelectItem>
                <SelectItem value="task_assignment">Affectations de tâches</SelectItem>
                <SelectItem value="employee_record">Dossiers employés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending_review">En attente de révision</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document, index) => {
          const IconComponent = getDocumentIcon(document.document_type);
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-6 w-6 text-terracotta-600" />
                      <div>
                        <CardTitle className="text-sm font-semibold text-adrar-800 line-clamp-1">
                          {document.title}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                          {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : ''}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(document.status || 'draft')}>
                      {document.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {document.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{document.file_name || 'Pas de fichier'}</span>
                    {document.file_size && (
                      <span>{formatFileSize(document.file_size)}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {document.file_url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDownload(document.file_url, document.file_name)}
                        disabled={downloading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloading ? 'Téléchargement...' : 'Télécharger'}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1"
                      onClick={() => handleViewDetails(document)}
                    >
                      Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document trouvé</h3>
          <p className="text-gray-500">
            Aucun document ne correspond à vos critères de recherche.
          </p>
        </div>
      )}

      {/* Document Details Dialog */}
      <DocumentDetails 
        document={selectedDocument}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};

export default DocumentsList;
