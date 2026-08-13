import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, Eye } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useAuth } from '@/contexts/use-auth';
import { getDocumentService } from '@/application/services/DocumentService';
import {
  DOCUMENT_TYPE_LABELS,
  getDocumentCategoriesForContext,
  type DocumentTypeCode as DocumentType,
} from '@/config/referentials/documents/document-types.referential';


interface ProjectDocumentUploadProps {
  projectId: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  stepId?: string | null;
  inspectionId?: string | null;
  stakeholderId?: string | null;
  context?: 'project' | 'phase' | 'step' | 'task' | 'inspection' | 'stakeholder' | 'compliance';
  contextLabel?: string;
  /** Type de document pré-sélectionné (ex: pièce attendue d'un contrôle réglementaire) */
  defaultDocumentType?: DocumentType;
  onDocumentUploaded?: () => void;
}


const ProjectDocumentUpload = ({ 
  projectId, 
  phaseId, 
  taskId,
  stepId,
  inspectionId, 
  stakeholderId, 
  context = 'project', 
  contextLabel,
  defaultDocumentType,
  onDocumentUploaded 
}: ProjectDocumentUploadProps) => {
  const documentCategories = React.useMemo(() => getDocumentCategoriesForContext(context), [context]);
  const initialCategory = React.useMemo(() => {
    if (defaultDocumentType) {
      const match = documentCategories.find((c) => c.types.includes(defaultDocumentType));
      if (match) return match.key;
    }
    return documentCategories[0]?.key ?? 'other';
  }, [defaultDocumentType, documentCategories]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: (defaultDocumentType ?? '') as DocumentType,
    status: 'draft' as const
  });

  const [file, setFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: typeof formData & { file?: File }) => {
      if (!user) {
        throw new Error('User must be authenticated to upload documents');
      }

      let fileUrl: string | null = null;
      let uploadedFileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      if (uploadData.file) {
        try {
          const uploadResult = await uploadFile(uploadData.file);
          
          if (uploadResult.success) {
            fileUrl = uploadResult.url || null;
            uploadedFileName = uploadResult.fileName || uploadData.file.name;
            fileSize = uploadResult.size || uploadData.file.size;
            mimeType = uploadData.file.type;
          } else {
            uploadedFileName = uploadData.file.name;
            fileSize = uploadData.file.size;
            mimeType = uploadData.file.type;
          }
        } catch (error) {
          console.warn('File upload error, proceeding without file:', error);
          uploadedFileName = uploadData.file.name;
          fileSize = uploadData.file.size;
          mimeType = uploadData.file.type;
        }
      }

      // ✅ Hexagonal: UI → Service → Repository → Adapter → DB
      return await getDocumentService().createDocument({
        title: uploadData.title,
        description: uploadData.description || null,
        documentType: uploadData.documentType,
        projectId: projectId ?? null,
        phaseId: phaseId ?? null,
        inspectionId: inspectionId ?? null,
        status: uploadData.status,
        fileUrl,
        fileName: uploadedFileName,
        fileSize,
        mimeType,
        uploadedBy: user.id,
        metadata: {
          context,
          stakeholder_id: stakeholderId,
          task_id: taskId,
          step_id: stepId,
          upload_context: contextLabel,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['project-documents'] });
      toast({
        title: "Succès",
        description: "Document téléchargé avec succès.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        documentType: (defaultDocumentType ?? '') as DocumentType,
        status: 'draft'
      });
      setFile(null);
      onDocumentUploaded?.();
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, documentType: '' as DocumentType }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.documentType) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    try {
      await uploadMutation.mutateAsync({ ...formData, file: file || undefined });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const availableTypes = documentCategories.find((c) => c.key === selectedCategory)?.types ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Télécharger un Document
          {contextLabel && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              - {contextLabel}
            </span>
          )}
        </CardTitle>
        {context !== 'project' && (
          <p className="text-sm text-muted-foreground">
            Document associé au contexte: {
              context === 'phase' ? 'Phase du projet' :
              context === 'step' ? 'Étape de phase' :
              context === 'task' ? 'Tâche' :
              context === 'inspection' ? 'Inspection' :
              context === 'stakeholder' ? 'Partie prenante' :
              context === 'compliance' ? 'Conformité' : 'Contexte spécifique'
            }
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Catégorie de Document *</Label>
            <div className="flex flex-wrap gap-2">
              {documentCategories.map((category) => (
                <Badge
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleCategoryChange(category.key)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Entrez le titre du document"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Type de Document *</Label>
              <Select value={formData.documentType} onValueChange={(value) => handleInputChange('documentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Entrez une description du document"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending_review">En attente de révision</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Fichier</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="flex-1"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="truncate max-w-[160px]">{file.name}</span>
                  <LocalFilePreviewButton file={file} title={formData.title || file.name} documentType={formData.documentType} />
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={uploading || uploadMutation.isPending} className="w-full">
            {uploading || uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Téléchargement en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Télécharger le Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectDocumentUpload;