
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { DEV_MODE, DEV_USER } from '@/config/constants';

const DocumentUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: '',
    project_id: '',
    status: 'draft'
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: typeof formData & { file?: File }) => {
      // Get current user - bypass in dev mode
      let user;
      if (DEV_MODE) {
        user = DEV_USER;
      } else {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          throw new Error('User must be authenticated to upload documents');
        }
        user = authUser;
      }

      let fileUrl: string | null = null;
      let uploadedFileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      // Upload file using storage abstraction
      if (uploadData.file) {
        const uploadResult = await uploadFile(uploadData.file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        fileUrl = uploadResult.url || null;
        uploadedFileName = uploadResult.fileName || uploadData.file.name;
        fileSize = uploadResult.size || uploadData.file.size;
        mimeType = uploadData.file.type;
      }

      // Create document record with uploaded_by field
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: uploadData.title,
          description: uploadData.description,
          document_type: uploadData.document_type as 'inspection_report' | 'location_photo' | 'project_report' | 'contract' | 'supplier_info' | 'task_assignment' | 'employee_record',
          project_id: uploadData.project_id || null,
          status: uploadData.status as 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived',
          file_url: fileUrl,
          file_name: uploadedFileName,
          file_size: fileSize,
          mime_type: mimeType,
          uploaded_by: user.id // Required for RLS policy compliance
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Succès",
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
        title: "Erreur",
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

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
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
