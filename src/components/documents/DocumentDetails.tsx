import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Camera, FileBarChart, FileCheck, Building2, ClipboardList, Users, Download, Calendar, User, FolderOpen, Eye } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useToast } from '@/hooks/use-toast';
import { T } from '@/components/i18n/T';

interface Document {
  id: string;
  title: string;
  description: string;
  documentType: string; // ✅ CAMELCASE: Instead of document_type
  status: string;
  fileUrl: string; // ✅ CAMELCASE: Instead of file_url
  fileName: string; // ✅ CAMELCASE: Instead of file_name
  fileSize: number; // ✅ CAMELCASE: Instead of file_size
  createdAt: string; // ✅ CAMELCASE: Instead of created_at
  uploadedBy: string; // ✅ CAMELCASE: Instead of uploaded_by
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  mimeType?: string; // ✅ CAMELCASE: Instead of mime_type
  
  // Legacy snake_case for backward compatibility
  document_type?: string; // Legacy snake_case for backward compatibility
  file_url?: string; // Legacy snake_case for backward compatibility
  file_name?: string; // Legacy snake_case for backward compatibility
  file_size?: number; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  uploaded_by?: string; // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  mime_type?: string; // Legacy snake_case for backward compatibility
}

interface DocumentDetailsProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentDetails = ({ document, open, onOpenChange }: DocumentDetailsProps) => {
  const { downloadFile, downloading } = useDocumentStorage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');

  if (!document) return null;

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
      draft: 'bg-muted text-foreground',
      pending_review: 'bg-warning/10 text-warning',
      approved: 'bg-success-soft text-success',
      rejected: 'bg-destructive/10 text-destructive',
      archived: 'bg-primary/10 text-primary'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-foreground';
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
      // ✅ PRIORITY: camelCase first, snake_case fallback with null safety
      const fileUrl = document.fileUrl || document.file_url || '';
      const fileName = document.fileName || document.file_name || 'document';
      
      if (!fileUrl) {
        throw new Error('No file URL available');
      }
      
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

  const isImage = (mimeType?: string, fileName?: string) => {
    console.log('🔍 Checking if image:', { mimeType, fileName });
    
    // Check MIME type first
    if (mimeType?.startsWith('image/')) {
      console.log('✅ Image detected by MIME type:', mimeType);
      return true;
    }
    
    // Fallback to file extension if MIME type is not available or reliable
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      const isImageExtension = imageExtensions.includes(extension || '');
      console.log('🔍 Checking file extension:', { extension, isImageExtension });
      return isImageExtension;
    }
    
    console.log('❌ Not an image');
    return false;
  };

  const isPDF = (mimeType?: string, fileName?: string) => {
    console.log('🔍 Checking if PDF:', { mimeType, fileName });
    
    // Check MIME type first
    if (mimeType === 'application/pdf') {
      console.log('✅ PDF detected by MIME type');
      return true;
    }
    
    // Fallback to file extension
    if (fileName) {
      const extension = fileName.toLowerCase().split('.').pop();
      const isPdfExtension = extension === 'pdf';
      console.log('🔍 Checking PDF extension:', { extension, isPdfExtension });
      return isPdfExtension;
    }
    
    console.log('❌ Not a PDF');
    return false;
  };

  const canPreview = () => {
    const hasFileUrl = !!document.file_url;
    const isImageFile = isImage(document.mime_type, document.file_name);
    const isPDFFile = isPDF(document.mime_type, document.file_name);
    
    console.log('🔍 Can preview check:', {
      hasFileUrl,
      isImageFile,
      isPDFFile,
      documentData: {
        file_url: document.file_url,
        file_name: document.file_name,
        mime_type: document.mime_type
      }
    });
    
    const canPreviewResult = hasFileUrl && (isImageFile || isPDFFile);
    console.log('📋 Final preview result:', canPreviewResult);
    
    return canPreviewResult;
  };

  const renderDocumentPreview = () => {
    if (!document.file_url) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p><T k="auto.documentdetails.aucun_fichier_disponible_pour_la_previsualisatio" fallback="Aucun fichier disponible pour la prévisualisation" /></p>
          </div>
        </div>
      );
    }

    if (isImage(document.mime_type, document.file_name)) {
      return (
        <div className="flex items-center justify-center bg-muted rounded-lg p-4">
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
          <div className="hidden text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p><T k="auto.documentdetails.impossible_de_charger_l_image" fallback="Impossible de charger l'image" /></p>
          </div>
        </div>
      );
    }

    if (isPDF(document.mime_type, document.file_name)) {
      return (
        <div className="w-full h-96 bg-muted rounded-lg overflow-hidden">
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
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2" />
          <p><T k="auto.documentdetails.previsualisation_non_disponible_pour_ce_type_de_" fallback="Prévisualisation non disponible pour ce type de fichier" /></p>
          <p className="text-sm mt-1">Type: {document.mime_type || 'Non spécifié'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="h-4 w-4 mr-2" />
            <T k="auto.documentdetails.telecharger_pour_consulter" fallback="Télécharger pour consulter" />
          </Button>
        </div>
      </div>
    );
  };

  const IconComponent = getDocumentIcon(document.document_type || 'other');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <IconComponent className="h-6 w-6 text-terracotta-600" />
            {document.title}
          </DialogTitle>
          <DialogDescription>
            Détails et prévisualisation du document {document.file_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2">
            <TabsTrigger value="details"><T k="auto.documentdetails.details" fallback="Détails" /></TabsTrigger>
            <TabsTrigger value="preview" disabled={!canPreview()}>
              <Eye className="h-4 w-4 mr-2" />
              <T k="auto.documentdetails.apercu" fallback="Aperçu" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 overflow-y-auto max-h-[60vh]">
            {/* Status and Type */}
            <div className="flex items-center justify-between">
              <Badge className={getStatusColor(document.status || 'draft')}>
                {getStatusLabel(document.status || 'draft')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getDocumentTypeLabel(document.document_type || 'other')}
              </span>
            </div>

            <Separator />

            {/* Description */}
            {document.description && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2"><T k="auto.documentdetails.description" fallback="Description" /></h3>
                <p className="text-sm text-muted-foreground">{document.description}</p>
              </div>
            )}

            {/* File Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2"><T k="auto.documentdetails.informations_du_fichier" fallback="Informations du fichier" /></h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground"><T k="auto.documentdetails.nom" fallback="Nom:" /></span>
                    <span className="font-medium">{document.file_name}</span>
                  </div>
                  {document.file_size && (
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground"><T k="auto.documentdetails.taille" fallback="Taille:" /></span>
                      <span className="font-medium">{formatFileSize(document.file_size)}</span>
                    </div>
                  )}
                  {document.mime_type && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground"><T k="auto.documentdetails.type" fallback="Type:" /></span>
                      <span className="font-medium">{document.mime_type}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2"><T k="auto.documentdetails.metadonnees" fallback="Métadonnées" /></h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground"><T k="auto.documentdetails.cree_le" fallback="Créé le:" /></span>
                    <span className="font-medium">
                      {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Non disponible'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground"><T k="auto.documentdetails.telecharge_par" fallback="Téléchargé par:" /></span>
                    <span className="font-medium">{document.uploaded_by}</span>
                  </div>
                  {document.project_id && (
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground"><T k="auto.documentdetails.projet_id" fallback="Projet ID:" /></span>
                      <span className="font-medium">{document.project_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="overflow-y-auto max-h-[60vh]">
            {renderDocumentPreview()}
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <T k="auto.documentdetails.fermer" fallback="Fermer" />
          </Button>
          {document.file_url && (
            <Button 
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDetails;
