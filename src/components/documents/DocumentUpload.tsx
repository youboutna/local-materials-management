import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DEV_MODE } from '@/config/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useDocumentCreate, useProjectsHex } from '@/hooks/hexagonal';
import { FileText, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Project = { id: string; title: string };

const DocumentUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: '',
    project_id: '',
    status: 'draft' as const
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();
  const { user } = useAuth();

  const { projects } = useProjectsHex();

  const { createDocument } = useDocumentCreate();

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: typeof formData & { file?: File }) => {
      // Get current user - use auth context
      if (!user) {
        throw new Error('User must be authenticated to upload documents');
      }

      let fileUrl: string | null = null;
      let uploadedFileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      // Upload file using storage abstraction - skip in dev mode if it fails
      if (uploadData.file) {
        try {
          const uploadResult = await uploadFile(uploadData.file);
          
          if (!uploadResult.success) {
            if (DEV_MODE) {
              console.warn('Dev mode: File upload failed, proceeding without file:', uploadResult.error);
              // In dev mode, continue without file upload
              uploadedFileName = uploadData.file.name;
              fileSize = uploadData.file.size;
              mimeType = uploadData.file.type;
            } else {
              throw new Error(uploadResult.error || 'Upload failed');
            }
          } else {
            fileUrl = uploadResult.url || null;
            uploadedFileName = uploadResult.fileName || uploadData.file.name;
            fileSize = uploadResult.size || uploadData.file.size;
            mimeType = uploadData.file.type;
          }
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          throw new Error('File upload failed');
        }
      }

      // Create document record with hexagonal architecture
      const documentData = {
        title: uploadData.title,
        description: uploadData.description,
        documentType: uploadData.document_type,
        projectId: uploadData.project_id || null,
        status: uploadData.status,
        fileUrl: fileUrl,
        fileName: uploadedFileName,
        fileSize: fileSize,
        mimeType: mimeType,
        uploadedBy: user.id
      };

      const result = await createDocument.mutateAsync(documentData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: t('common.success'),
        description: "Document créé avec succès.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        document_type: '',
        project_id: '',
        status: 'draft'
      });
      setFile(null);
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast({
        title: t('common.error'),
        description: error.message || "Une erreur inattendue s'est produite.",
        variant: "destructive"
      });
    }
  });

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
        title: t('common.error'),
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          Télécharger un Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Projet (optionnel)</Label>
              <Select value={formData.project_id} onValueChange={(value) => handleInputChange('project_id', value)}>
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
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-1" />
                  {file.name}
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
                Créer le Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
