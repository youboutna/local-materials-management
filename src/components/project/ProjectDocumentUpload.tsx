import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import type { DocumentType } from '@/types/document';

interface ProjectDocumentUploadProps {
  projectId: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  stepId?: string | null;
  inspectionId?: string | null;
  stakeholderId?: string | null;
  context?: 'project' | 'phase' | 'step' | 'task' | 'inspection' | 'stakeholder' | 'compliance';
  contextLabel?: string;
  onDocumentUploaded?: () => void;
}

// Context-aware document categories
const getDocumentCategoriesByContext = (context: string) => {
  const baseCategories = {
    administrative: {
      label: 'Documents Administratifs',
      types: ['contract', 'administrative'] as DocumentType[]
    },
    technical: {
      label: 'Documents Techniques', 
      types: ['technical', 'specification', 'drawing'] as DocumentType[]
    },
    inspection: {
      label: 'Rapports et Inspections',
      types: ['inspection', 'report'] as DocumentType[]
    },
    payment: {
      label: 'Documents Financiers',
      types: ['payment', 'invoice', 'payment_receipt'] as DocumentType[]
    },
    invoice: {
      label: 'Factures',
      types: ['invoice'] as DocumentType[]
    },
    delivery: {
      label: 'Documents de Livraison',
      types: ['delivery_note'] as DocumentType[]
    },
    photos: {
      label: 'Photos et Médias',
      types: ['photo'] as DocumentType[]
    },
    compliance: {
      label: 'Conformité et Certification',
      types: ['technical', 'administrative', 'inspection'] as DocumentType[]
    },
    stakeholder: {
      label: 'Documents Parties Prenantes',
      types: ['contract', 'administrative', 'supplier_info'] as DocumentType[]
    },
    other: {
      label: 'Autres',
      types: ['other', 'supplier_upload', 'supplier_info'] as DocumentType[]
    }
  };

  // Filter categories based on context
  switch (context) {
    case 'inspection':
      return {
        inspection: baseCategories.inspection,
        technical: baseCategories.technical,
        photos: baseCategories.photos,
        other: baseCategories.other
      };
    case 'phase':
      return {
        technical: baseCategories.technical,
        inspection: baseCategories.inspection,
        photos: baseCategories.photos,
        delivery: baseCategories.delivery,
        invoice: baseCategories.invoice,
        other: baseCategories.other
      };
    case 'step':
      return {
        technical: baseCategories.technical,
        photos: baseCategories.photos,
        delivery: baseCategories.delivery,
        invoice: baseCategories.invoice,
        other: baseCategories.other
      };
    case 'stakeholder':
      return {
        stakeholder: baseCategories.stakeholder,
        administrative: baseCategories.administrative,
        other: baseCategories.other
      };
    case 'compliance':
      return {
        compliance: baseCategories.compliance,
        administrative: baseCategories.administrative,
        technical: baseCategories.technical,
        other: baseCategories.other
      };
    case 'task':
      return {
        technical: baseCategories.technical,
        photos: baseCategories.photos,
        delivery: baseCategories.delivery,
        payment: baseCategories.payment,
        invoice: baseCategories.invoice,
        other: baseCategories.other
      };
    default:
      return baseCategories;
  }
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'inspection': 'Rapport d\'inspection',
  'payment': 'Document de paiement',
  'invoice': 'Facture',
  'delivery_note': 'Bon de livraison',
  'payment_receipt': 'Reçu de paiement',
  'technical': 'Document technique',
  'administrative': 'Document administratif',
  'supplier_upload': 'Upload fournisseur',
  'supplier_catalog': 'Catalogue fournisseur',
  'supplier_info': 'Information fournisseur',
  'contract': 'Contrat',
  'report': 'Rapport',
  'specification': 'Spécification',
  'drawing': 'Plan/Dessin',
  'photo': 'Photo',
  'other': 'Autre'
};

const ProjectDocumentUpload = ({ 
  projectId, 
  phaseId, 
  taskId,
  stepId,
  inspectionId, 
  stakeholderId, 
  context = 'project', 
  contextLabel,
  onDocumentUploaded 
}: ProjectDocumentUploadProps) => {
  const DOCUMENT_CATEGORIES = getDocumentCategoriesByContext(context);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof DOCUMENT_CATEGORIES>(
    Object.keys(DOCUMENT_CATEGORIES)[0] as keyof typeof DOCUMENT_CATEGORIES
  );
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: '' as DocumentType,
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

      const documentInsert = {
        title: uploadData.title,
        description: uploadData.description,
        document_type: uploadData.document_type,
        project_id: projectId,
        phase_id: phaseId,
        inspection_id: inspectionId,
        status: uploadData.status,
        file_url: fileUrl,
        file_name: uploadedFileName,
        file_size: fileSize,
        mime_type: mimeType,
        uploaded_by: user.id,
        metadata: {
          context,
          stakeholder_id: stakeholderId,
          task_id: taskId,
          step_id: stepId,
          upload_context: contextLabel
        }
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentInsert as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
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
        document_type: '' as DocumentType,
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

  const handleCategoryChange = (category: keyof typeof DOCUMENT_CATEGORIES) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, document_type: '' as DocumentType }));
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
    
    if (!formData.title || !formData.document_type) {
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

  const availableTypes = DOCUMENT_CATEGORIES[selectedCategory]?.types || [];

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
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                <Badge
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20"
                  onClick={() => handleCategoryChange(key as keyof typeof DOCUMENT_CATEGORIES)}
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
              <Select value={formData.document_type} onValueChange={(value) => handleInputChange('document_type', value)}>
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-1" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
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