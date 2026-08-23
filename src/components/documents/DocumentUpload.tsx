// ============================================================
// src/components/documents/DocumentUpload.tsx
// ============================================================
/**
 * Document Upload Component
 * Utilise les hooks hexagonaux pour l'upload de documents
 * Hexagonal: Component → Hook Hex → Service → Repository → DB
 * 
 * Utilise useDocumentsHex pour:
 * - createDocument (upload)
 * - isCreating (état de chargement)
 * - Gestion des erreurs
 */

import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Loader2, Upload, CheckCircle, AlertCircle, X, Image, File, FileArchive } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { LocalFilePreviewButton } from '@/components/documents/viewer';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthHex } from '@/hooks/hexagonal/useAuthHex';
import { useDocumentsHex, useDocumentCreate } from '@/hooks/hexagonal/useDocumentsHex';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { DocumentType, DocumentStatus, CreateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { T } from '@/components/i18n/T';

interface DocumentUploadProps {
  embedded?: boolean;
  projectId?: string;
  onSuccess?: (document: any) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  embedded = false, 
  projectId: propProjectId,
  onSuccess,
  onError,
  onCancel,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif'],
  maxSizeMB = 50
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: '' as DocumentType | '',
    projectId: propProjectId || '',
    status: DocumentStatus.DRAFT,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  // ✅ Hooks hexagonaux
  const { user } = useAuthHex();
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  const { createDocument, isCreating, isError, error: createError } = useDocumentCreate();

  // ============================================================
  // Reset form
  // ============================================================
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      documentType: '',
      projectId: propProjectId || '',
      status: DocumentStatus.DRAFT,
    });
    setFile(null);
    setUploadProgress(0);
  }, [propProjectId]);

  // ============================================================
  // Handlers
  // ============================================================

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file size
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'Erreur',
        description: `Le fichier est trop volumineux (max ${maxSizeMB}MB)`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file type
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.some(type => 
      type === fileExtension || 
      (type.startsWith('.') && fileExtension === type) ||
      (type === 'image/*' && selectedFile.type.startsWith('image/')) ||
      (type === 'application/*' && selectedFile.type.startsWith('application/'))
    );
    
    if (!isValidType) {
      toast({
        title: 'Erreur',
        description: `Type de fichier non supporté. Formats acceptés: ${acceptedTypes.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    setFile(selectedFile);
    // Auto-fill title if empty
    if (!formData.title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^.]+$/, '');
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    const input = document.getElementById('file') as HTMLInputElement;
    if (input) input.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t('common.error') || 'Erreur',
        description: 'Vous devez être authentifié',
        variant: 'destructive',
      });
      return;
    }

    if (!file) {
      toast({
        title: t('common.error') || 'Erreur',
        description: 'Veuillez sélectionner un fichier',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: t('common.error') || 'Erreur',
        description: 'Le titre est requis',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.documentType) {
      toast({
        title: t('common.error') || 'Erreur',
        description: 'Le type de document est requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // ✅ Utilisation du hook hexagonal useDocumentCreate
      const createData: CreateDocumentDTO = {
        title: formData.title,
        documentType: formData.documentType as DocumentType,
        projectId: formData.projectId || undefined,
        description: formData.description || undefined,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user.id,
        status: formData.status,
        isInternalOnly: false,
        isSharedWithSuppliers: false,
        tags: [],
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.id,
        }
      };

      // Utiliser le mutateAsync du hook
      const result = await createDocument.mutateAsync(createData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Invalider le cache
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (formData.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-documents', formData.projectId] });
      }

      toast({
        title: t('common.success') || 'Succès',
        description: 'Document uploadé avec succès',
      });
      
      resetForm();
      
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('common.error') || 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'upload',
        variant: 'destructive',
      });
      if (onError) onError(error instanceof Error ? error : new Error('Upload failed'));
    }
  };

  // ============================================================
  // File icon
  // ============================================================
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6 text-primary" />;
    if (fileType === 'application/pdf') return <FileText className="h-6 w-6 text-destructive" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-6 w-6 text-primary" />;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <FileArchive className="h-6 w-6 text-warning" />;
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  // ============================================================
  // Render Form
  // ============================================================

  const renderForm = () => (
    <>
      {/* Project selection (only if no projectId prop) */}
      {!propProjectId && (
        <div className="space-y-2">
          <Label htmlFor="project_id"><T k="auto.documentupload.projet_optionnel" fallback="Projet (optionnel)" /></Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(value) => handleInputChange('projectId', value)}
            disabled={projectsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un projet" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          <T k="auto.documentupload.titre" fallback="Titre" /> <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Entrez le titre du document"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="documentType">
          <T k="auto.documentupload.type_de_document" fallback="Type de Document" /> <span className="text-destructive">*</span>
        </Label>
        <Select 
          value={formData.documentType} 
          onValueChange={(value) => handleInputChange('documentType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DocumentType.CONTRACT}><T k="auto.documentupload.contrat" fallback="Contrat" /></SelectItem>
            <SelectItem value={DocumentType.INVOICE}><T k="auto.documentupload.facture" fallback="Facture" /></SelectItem>
            <SelectItem value={DocumentType.REPORT}><T k="auto.documentupload.rapport" fallback="Rapport" /></SelectItem>
            <SelectItem value={DocumentType.CERTIFICATE}><T k="auto.documentupload.certificat" fallback="Certificat" /></SelectItem>
            <SelectItem value={DocumentType.PERMIT}><T k="auto.documentupload.permis" fallback="Permis" /></SelectItem>
            <SelectItem value={DocumentType.INSURANCE}><T k="auto.documentupload.assurance" fallback="Assurance" /></SelectItem>
            <SelectItem value={DocumentType.PHOTO}><T k="auto.documentupload.photo" fallback="Photo" /></SelectItem>
            <SelectItem value={DocumentType.MANUAL}><T k="auto.documentupload.manuel" fallback="Manuel" /></SelectItem>
            <SelectItem value={DocumentType.WARRANTY}><T k="auto.documentupload.garantie" fallback="Garantie" /></SelectItem>
            <SelectItem value={DocumentType.OTHER}><T k="auto.documentupload.autre" fallback="Autre" /></SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description"><T k="auto.documentupload.description" fallback="Description" /></Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Entrez une description du document"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status"><T k="auto.documentupload.statut" fallback="Statut" /></Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => handleInputChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DocumentStatus.DRAFT}><T k="auto.documentupload.brouillon" fallback="Brouillon" /></SelectItem>
            <SelectItem value={DocumentStatus.PENDING_APPROVAL}><T k="auto.documentupload.en_attente" fallback="En attente" /></SelectItem>
            <SelectItem value={DocumentStatus.APPROVED}><T k="auto.documentupload.approuve" fallback="Approuvé" /></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File upload area */}
      <div className="space-y-2">
        <Label>
          <T k="auto.documentupload.fichier" fallback="Fichier" /> <span className="text-destructive">*</span>
        </Label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : file 
                ? 'border-success bg-success-soft' 
                : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={acceptedTypes.join(',')}
          />
          
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div>
                  <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
              <LocalFilePreviewButton file={file} title={formData.title || file.name} documentType={formData.documentType} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                <T k="auto.documentupload.glissez_deposez_votre_fichier_ici_ou_cliquez_pou" fallback="Glissez-déposez votre fichier ici ou cliquez pour parcourir" />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(isCreating || uploadProgress > 0) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <T k="auto.documentupload.telechargement_en_cours" fallback="Téléchargement en cours..." />
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Error display */}
      {(isError || createError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle><T k="auto.documentupload.erreur" fallback="Erreur" /></AlertTitle>
          <AlertDescription>
            {createError instanceof Error ? createError.message : 'Une erreur est survenue'}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button 
          type="submit" 
          disabled={isCreating || !file || !formData.title || !formData.documentType}
          className="flex-1"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <T k="auto.documentupload.upload_en_cours" fallback="Upload en cours..." />
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              <T k="auto.documentupload.uploader_le_document" fallback="Uploader le Document" />
            </>
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <T k="auto.documentupload.annuler" fallback="Annuler" />
          </Button>
        )}
      </div>
    </>
  );

  // ============================================================
  // Render
  // ============================================================

  if (embedded) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderForm()}
      </form>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            <T k="auto.documentupload.uploader_un_document" fallback="Uploader un Document" />
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderForm()}
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;