
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Camera, FileBarChart, FileCheck, Building2, ClipboardList, Users, Download, Calendar, User, FolderOpen, ExternalLink } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  description: string;
  document_type: string;
  status: string;
  file_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
  uploaded_by: string;
  project_id: string;
  mime_type?: string;
}

interface DocumentViewerProps {
  document: Document;
}

const DocumentViewer = ({ document }: DocumentViewerProps) => {
  const { downloadFile, downloading } = useDocumentStorage();
  const { toast } = useToast();

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

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      inspection_report: 'Rapport d\'inspection',
      location_photo: 'Photo de localisation',
      project_report: 'Rapport de projet',
      contract: 'Contrat',
      supplier_info: 'Informations fournisseur',
      task_assignment: 'Affectation de tâche',
      employee_record: 'Dossier employé'
    };
    return labels[type as keyof typeof labels] || type;
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

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Brouillon',
      pending_review: 'En attente de révision',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      archived: 'Archivé'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      const result = await downloadFile(document.file_url, document.file_name);
      
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

  const handleViewInNewTab = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank');
    }
  };

  const isImage = (mimeType?: string, fileName?: string) => {
    if (mimeType?.startsWith('image/')) return true;
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      return imageExtensions.includes(extension || '');
    }
    return false;
  };

  const isPDF = (mimeType?: string, fileName?: string) => {
    if (mimeType === 'application/pdf') return true;
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      return extension === 'pdf';
    }
    return false;
  };

  const renderDocumentContent = () => {
    if (!document.file_url) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p>Aucun fichier disponible</p>
          </div>
        </div>
      );
    }

    if (isImage(document.mime_type, document.file_name)) {
      return (
        <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
          <img 
            src={document.file_url} 
            alt={document.title}
            className="max-w-full max-h-96 object-contain rounded shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const errorDiv = target.nextElementSibling as HTMLElement;
              if (errorDiv) {
                errorDiv.classList.remove('hidden');
              }
            }}
          />
          <div className="hidden text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p>Impossible de charger l'image</p>
          </div>
        </div>
      );
    }

    if (isPDF(document.mime_type, document.file_name)) {
      return (
        <div className="w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
          <iframe 
            src={`${document.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={document.title}
            onError={() => {
              toast({
                title: "Erreur de prévisualisation",
                description: "Impossible de charger le PDF. Vous pouvez le télécharger pour le consulter.",
                variant: "destructive"
              });
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p>Prévisualisation non disponible pour ce type de fichier</p>
          <p className="text-sm mt-1">Type: {document.mime_type || 'Non spécifié'}</p>
        </div>
      </div>
    );
  };

  const IconComponent = getDocumentIcon(document.document_type);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconComponent className="h-6 w-6 text-terracotta-600" />
            <div>
              <CardTitle className="text-lg">{document.title}</CardTitle>
              <p className="text-sm text-gray-600">{document.file_name}</p>
            </div>
          </div>
          <Badge className={getStatusColor(document.status)}>
            {getStatusLabel(document.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Document Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Contenu du document</h3>
          {renderDocumentContent()}
        </div>

        <Separator />

        {/* Document Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Informations</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{getDocumentTypeLabel(document.document_type)}</span>
              </div>
              {document.file_size && (
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium">{formatFileSize(document.file_size)}</span>
                </div>
              )}
              {document.mime_type && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">{document.mime_type}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Métadonnées</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Créé le:</span>
                <span className="font-medium">
                  {new Date(document.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Par:</span>
                <span className="font-medium">{document.uploaded_by}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{document.description}</p>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex gap-3">
          {document.file_url && (
            <>
              <Button 
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Téléchargement...' : 'Télécharger'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewInNewTab}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
